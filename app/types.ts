export interface IIconProps {
  type: string
  props: any
}

export interface IOpenAIMessages {
  role: string
  content: string
}

export interface IOpenAIUserHistory {
  user: string
  assistant: string
  fileIds?: any[]
}

export interface IOpenAIStateWithIndex {
  index: string
  messages: IOpenAIUserHistory[]
}