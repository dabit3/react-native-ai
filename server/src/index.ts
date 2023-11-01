import express from 'express'
import chatRouter from './chat/chatRouter'
import 'dotenv/config'

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/chat', chatRouter)

app.listen(3050, () => {
  console.log('Server started on port 3050')
})
