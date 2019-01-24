import fetch from 'node-fetch'
import fs from 'fs'
import { promisify } from 'util'
import { startCase } from 'lodash'
import unzip from 'unzip'
import Integration from './Integration'
import map from './Treasure'

import {COLORS, RARITY, LAYOUT} from './AllowedValues'

const readFileAsync = promisify(fs.readFile)
const path = '/tmp/mtgjson'
const jsonUrl = 'https://mtgjson.com/json/AllSets.json.zip'

const colorMap = {
  White: 'W',
  Black: 'B',
  Blue: 'U',
  Red: 'R',
  Green: 'G'
}

const layoutMap = {
  'aftermath': 'split'
}

const rarityMap = {
  "mythic": "Mythic Rare"
}

const transform = {
  multiverseid: {
    field: 'multiverseId',
    allowNull: false
  },
  name: 'name',
  cmc: 'convertedManaCost',
  type: 'type',
  cardNumber: 'number',
  oracleText: 'text',
  manaCost: 'manaCost',
  colors: {
    field: 'colors',
    fn: (colors) => colors ? colors.reduce((result, color) => {
      result.push(colorMap[color] || color)
      return result
    }, []) : [],
    allowed: COLORS
  },
  colorIdentity: 'colorIdentity',
  layout: {
    field: 'layout',
    fn: (layout) => layoutMap[layout] ? layoutMap[layout].toLowerCase() : layout.toLowerCase(),
    allowed: LAYOUT
  },
  blockCode: {
    field: 'blockCode',
    allowNull: false
  },
  blockName: {
    field: 'blockName',
    allowNull: false
  },
  rarity: {
    field: 'rarity',
    allowed: RARITY
  },
  flavor: 'flavor',
  artist: 'artist'
}

export default class MtgJSON extends Integration {
  static flattenBlocksToCards(blocks) {
    const flattened = Object.keys(blocks).reduce((cardsResult, blockCode) => {
      const { name, code, cards } = blocks[blockCode]
      cardsResult.push(...cards.map(card => {
        card.blockName = name
        card.blockCode = code.toUpperCase()
        card.rarity = rarityMap[card.rarity] ? rarityMap[card.rarity] : startCase(card.rarity)
        return card
      }))
      return cardsResult
    }, [])
    return flattened.filter(card => card.rarity !== 'Basic Land' && card.multiverseId !== undefined)
  }

  static downloadJson(url) {
    return new Promise(async (resolve, reject) => {
      const response = await fetch(url)
      response.body.pipe(unzip.Extract({ path }))
        .on('error', (e) => reject(e))
        .on('close', () => resolve({ success: true }))
    })
  }

  static async readJson() {
    return JSON.parse(await readFileAsync(`${path}/AllSets.json`))
  }

  static getJsonPath() {
    if (!process.env.SERRAPI) {
      throw new Error('process.env.SERRAPI not defined')
    }
    return `${process.env.SERRAPI}/v1/json`
  }

  static async getByBlockCode(blockCode = '') {
    return map({
      data: await fetch(MtgJSON.getJsonPath()).then(res => res.json()),
      before: data => MtgJSON.flattenBlocksToCards(data).filter(cards => cards.blockCode === blockCode.toUpperCase()),
      transform,
      after: data => data.filter(card => !card.type.startsWith('Basic Land — '))
    })
  }

  static async getAll() {
    return map({
      data: await fetch(MtgJSON.getJsonPath()).then(res => res.json()),
      before: data => MtgJSON.flattenBlocksToCards(data),
      transform,
      after: (data) => data.sort((a, b) => a.multiverseid - b.multiverseid)
    })
  }
}