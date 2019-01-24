import express from 'express'
import Scryfall from './integrations/Scryfall'
import MtgJSON from './integrations/MtgJSON'

let wrap = fn => (...args) => fn(...args)
  .then((attr) => args[1].json(attr))
  .catch(args[2])

const services = {
  'scryfall': Scryfall,
  'mtgjson': MtgJSON
}

function populateFlipCardInfo(card, cards) {
  if (!card.cardNumber || !card.cardNumber.endsWith('a') && !card.cardNumber.endsWith('b')) {
    card.displayName = card.name
    return card
  } if(card.layout === 'split') {
    const flipCard = findFlipCard(card, cards)
    if (flipCard) {
      card.displayName = card.cardNumber.endsWith('a') ? `${card.name} // ${flipCard.name}` : `${flipCard.name} // ${card.name}`
      card.relatedCards = [{
        name: flipCard.name,
        cardNumber: flipCard.cardNumber,
        layout: flipCard.layout
      }]
    }
    return card
  } else if (card.layout !== 'double-faced') {
    card.displayName = card.name
    return card
  }

  const flipCard = findFlipCard(card, cards)
  if (!flipCard) {
    return card
  }
  card.displayName = card.cardNumber.endsWith('a') ? `${card.name} // ${flipCard.name}` : `${flipCard.name} // ${card.name}`
  card.relatedCards = [{
    name: flipCard.name,
    cardNumber: flipCard.cardNumber,
    layout: flipCard.layout
  }]

  card.flipName = flipCard.name
  card.flipMultiverseid = flipCard.multiverseid
  card.flipCardNumber = flipCard.cardNumber
  return card
}

function findFlipCard(card, cards) {
  const flipSideCardNumberPostfix = card.cardNumber.endsWith('a') ? 'b' : 'a'
  return cards.filter(c => c.blockCode === card.blockCode).find(c => c.cardNumber === card.cardNumber.slice(0, -1) + flipSideCardNumberPostfix)
}

exports.boot = (port) => {
  const app = express();
  console.log('Express started')
  app.get('/api/v1/cards/', wrap(async (req, res) => {
    const { blockCode } = req.query
    const service = services[req.query.service]
    if (!service) {
      throw new Error('Service is required parameter in request!')
    }
    const cards = blockCode ? await service.getByBlockCode(blockCode) : await service.getAll()

    return cards.map(card => populateFlipCardInfo(card, cards))
  }))

  app.use((err, req, res, next) => {
    return res.status(400).send(`ERROR: ${err.message}`)
  })

  console.log('Routes initialized')

  return new Promise((resolve) => app.listen(port, () => resolve(true)))
}
