import map from '../Treasure'

const transform = {
  name: 'cardName',
  artist: 'artistName',
  setCode: {
    field: 'blockCode',
    fn: (setName) => setName.toUpperCase()
  }
}

describe('treasure', () => {

  describe('before map', () => {
    it('should be run with object', () => {
      const result = map({
        data: {},
        before: (data) => {
          data.blockCode = 'ema'
          return data
        },
        transform,
        after: (data) => {
          data.cardName = 'Emrakul'
          return data
        }
      })
      expect(result).toEqual({ cardName: 'Emrakul', setCode: 'EMA' })
    })
    it('should run before and after with empty array', () => {
      const result = map({
        data: [],
        before: (data) => {
          data.push({ cardName: 'Fling', blockCode: 'hou' })
          return data
        },
        transform,
        after: (data) => {
          data.push({ name: "Emrakul", setCode: "emn" })
          return data
        }
      })
      expect(result).toEqual([{ "name": "Fling", "setCode": "HOU" }, { "name": "Emrakul", "setCode": "emn" }])
    })
  })

  describe('transform', () => {
    it('should support objects', () => {
      const result = map({
        data: { cardName: 'Fling', blockName: 'Hour of Devastataion', blockCode: 'hou' },
        transform
      })
      expect(result).toEqual({ name: "Fling", setCode: "HOU" })
    })

    it('should handle undefined', () => {
      const result = map({
        data: undefined,
        transform
      })
      expect(result).toEqual(undefined)
    })
    it('should support arrays', () => {
      const result = map({
        data: [{ cardName: 'Fling', blockCode: 'hou' }, { cardName: 'Emrakul', blockCode: 'emn' }],
        transform
      })
      expect(result).toEqual([{ name: "Fling", setCode: "HOU" }, { name: "Emrakul", setCode: "EMN" }])
    })
    it('should support empty arrays', () => {
      const result = map({
        data: [],
        transform
      })
      expect(result).toEqual([])
    })
  })
})