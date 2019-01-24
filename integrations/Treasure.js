function transform(transformMap, data) {
  return Object.keys(transformMap).reduce((result, key) => {
    if (typeof transformMap[key] === 'string') {
      result[key] = data[transformMap[key]]
    } else if (typeof transformMap[key] === 'object') {
      const { field, fn } = transformMap[key]
      result[key] = fn ? fn(data[field]) : data[field]
    }

    const { allowed, allowNull } = transformMap[key]

    if (allowNull === false && !result[key]) {
      throw new Error(`Null value not allowed for field: ${key}`)
    }

    if (allowed && result[key]) {
      if (Array.isArray(result[key])) {
        result[key].forEach(value => {
          if (value && !allowed.includes(value)) {
            throw new Error(`${allowed} does not include ${value} ${JSON.stringify(result)}`)
          }
        })

      } else if (!allowed.includes(result[key])) {
        throw new Error(`${allowed} does not include ${result[key]} ${JSON.stringify(result)}`)
      }
    }

    return result
  }, {})
}

const isObject = (obj) => {
  return obj !== null && typeof obj === 'object'
}

const transformArray = (map, data) => data.map(card => transform(map, card))
const transformObject = (map, data) => transform(map, data)

const map = ({ data, before, after, transform }) => {
  if (!isObject(data) && !Array.isArray(data)) {
    return data
  }
  const processedBefore = before ? before(data) : data
  const transformed = Array.isArray(processedBefore) ? transformArray(transform, processedBefore) : transformObject(transform, processedBefore)
  return after ? after(transformed) : transformed
}

export default map