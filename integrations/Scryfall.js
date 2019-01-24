import Integration from './Integration'
import fetch from 'node-fetch'
import map from './Treasure'

import {COLORS, RARITY, LAYOUT} from './AllowedValues'

const layoutMap = {
  'transform': 'double-faced'
}

const rarityMap = {
  'uncommon': 'Uncommon',
  'common': 'Common',
  'rare': 'Rare',
  'mythic': 'Mythic Rare'
}

const transform = {
  multiverseid: {
    field: 'multiverse_id',
    allowNull: false
  },
  name: 'name',
  cmc: 'cmc',
  type: 'type_line',
  oracleText: 'oracle_text',
  cardNumber: 'collector_number',
  manaCost: 'mana_cost',
  colors: {
    field: 'colors',
    allowed: COLORS
  },
  colorIdentity: 'color_identity',
  layout: {
    field: 'layout',
    fn: (layout) => layoutMap[layout] ? layoutMap[layout].toLowerCase() : layout.toLowerCase(),
    allowed: LAYOUT
  },
  blockCode: {
    field: 'set',
    allowNull: false,
    fn: (blockCode) => blockCode.toUpperCase()
  },
  blockName: {
    field: 'set_name',
    allowNull: false
  },
  rarity: {
    field: 'rarity',
    fn: (rarity) => rarityMap[rarity] ? rarityMap[rarity] : rarity,
    allowed: RARITY
  },
  flavor: 'flavor_text',
  artist: 'artist'
}

export default class Scryfall extends Integration {

  static timeout(milliseconds) {
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), milliseconds))
  }

  static async getByBlockCode(blockCode) {
    let url = `https://api.scryfall.com/cards/search?q=-t%3Abasic+s%3A${blockCode}`
    let foundCards = []
    let totalCards
    let iterations = 0

    while (url) {
      const { data, total_cards, next_page } = await (await fetch(url)).json()
      totalCards = total_cards
      foundCards = foundCards.concat(data)
      url = next_page
      iterations = iterations + 1
      if (iterations > 10) {
        throw new Error('More than 10 iterations! There may be a problem..!')
      }
      if (url) {
        await Scryfall.timeout(85)
      }
    }

    if (foundCards.length !== totalCards) {
      throw Error(`Card cound mismatch: ${foundCards.length} / ${totalCards}`)
    }


    return map({
      data: foundCards,
      transform,
      after: (data) => data.sort((a, b) => a.multiverseid - b.multiverseid)
    })
  }
}