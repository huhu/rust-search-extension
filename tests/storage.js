const storage = {
  getItem(key) {
    return new Promise(resolve => {
      resolve(JSON.parse(localStorage.getItem(key)))
    })
  },

  setItem(key, value) {
    return new Promise(resolve => {
      resolve(localStorage.setItem(key, JSON.stringify(value)))
    })
  },

  removeItem(key) {
    return new Promise(resolve => {
      resolve(localStorage.removeItem(key))
    })
  }
}