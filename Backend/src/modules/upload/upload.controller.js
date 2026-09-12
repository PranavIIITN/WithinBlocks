import { saveProductImage, saveCompanyLogo, saveCompanySignature } from './upload.service.js'

// Upload product image
export const uploadProductImageController = async (req, res, next) => {
  try {
    const { companyId } = req.user
    const { productId } = req.params

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const imageUrl = req.file.path
    const product = await saveProductImage(productId, companyId, imageUrl)

    res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully',
      data: { image: product.image },
    })
  } catch (error) {
    next(error)
  }
}

// Upload company logo
export const uploadLogoController = async (req, res, next) => {
  try {
    const { companyId } = req.user

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const imageUrl = req.file.path
    const company = await saveCompanyLogo(companyId, imageUrl)

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { logo: company.logo },
    })
  } catch (error) {
    next(error)
  }
}

// Upload company signature
export const uploadSignatureController = async (req, res, next) => {
  try {
    const { companyId } = req.user

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const imageUrl = req.file.path
    const company = await saveCompanySignature(companyId, imageUrl)

    res.status(200).json({
      success: true,
      message: 'Signature uploaded successfully',
      data: { signature: company.signature },
    })
  } catch (error) {
    next(error)
  }
}