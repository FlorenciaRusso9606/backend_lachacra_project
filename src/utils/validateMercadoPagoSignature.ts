import crypto from 'crypto'

type ValidateSignatureParams = {
  signature: string
  requestId: string
  rawBody: string
  secret: string
}

export const validateMercadoPagoSignature = ({
  signature,
  requestId,
  rawBody,
  secret,
}: ValidateSignatureParams): boolean => {
  const payload = `${requestId}.${rawBody}`

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return expectedSignature === signature
}
