export function createEventParser(onData: (data: string) => void) {
  let buffer = ''
  let data: string[] = []
  let eventSize = 0
  const dispatch = () => {
    if (data.length) onData(data.join('\n'))
    data = []
    eventSize = 0
  }
  return {
    push(chunk: string) {
      buffer += chunk
      if (buffer.length > 2_000_000) throw new Error('The server sent an oversized stream event.')
      let newline: number
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, '')
        buffer = buffer.slice(newline + 1)
        if (!line) dispatch()
        else if (line.startsWith('data:')) {
          eventSize += line.length
          if (eventSize > 2_000_000) throw new Error('The server sent an oversized stream event.')
          data.push(line.slice(5).replace(/^ /, ''))
        }
      }
    },
    end() {
      if (buffer.startsWith('data:')) data.push(buffer.slice(5).replace(/^ /, '').replace(/\r$/, ''))
      buffer = ''
      dispatch()
    }
  }
}
