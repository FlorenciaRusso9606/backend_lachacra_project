export interface OrderEmailPayload  {
  id: number
  customerName: string
  email: string
  total: number
  items: {
    quantity: number
    product: {
      name: string
    }
  }[]
}
