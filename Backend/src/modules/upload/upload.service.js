import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import prisma from '../../lib/prisma.js'
import 'dotenv/config'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper — extract public_id from Cloudinary URL
const getPublicId = (url) => {
  try {
    const urlParts = url.split('/')
    const filename = urlParts[urlParts.length - 1].split('.')[0]
    const folder = urlParts[urlParts.length - 2]
    const subfolder = urlParts[urlParts.length - 3]
    return `${subfolder}/${folder}/${filename}`
  } catch {
    return null
  }
}

// Helper — delete image from Cloudinary
const deleteFromCloudinary = async (url) => {
  try {
    const publicId = getPublicId(url)
    if (publicId) {
      await cloudinary.uploader.destroy(publicId)
    }
  } catch (err) {
    console.error('Failed to delete old image from Cloudinary:', err)
  }
}

// Storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'withinblocks/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
})

// Storage for company logo
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'withinblocks/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 300, height: 300, crop: 'limit' }],
  },
})

// Storage for company signature
const signatureStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'withinblocks/signatures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 200, crop: 'limit' }],
  },
})

// Multer instances
export const uploadProductImage = multer({ storage: productStorage })
export const uploadLogo = multer({ storage: logoStorage })
export const uploadSignature = multer({ storage: signatureStorage })

// Save product image URL to database
export const saveProductImage = async (productId, companyId, imageUrl) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId },
  })

  if (!product) {
    const error = new Error('Product not found')
    error.statusCode = 404
    throw error
  }

  // Delete old image from Cloudinary
  if (product.image) {
    await deleteFromCloudinary(product.image)
  }

  return await prisma.product.update({
    where: { id: productId },
    data: { image: imageUrl },
  })
}

// Save company logo URL to database
export const saveCompanyLogo = async (companyId, imageUrl) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  // Delete old logo from Cloudinary
  if (company?.logo) {
    await deleteFromCloudinary(company.logo)
  }

  return await prisma.company.update({
    where: { id: companyId },
    data: { logo: imageUrl },
  })
}

// Save company signature URL to database
export const saveCompanySignature = async (companyId, imageUrl) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  // Delete old signature from Cloudinary
  if (company?.signature) {
    await deleteFromCloudinary(company.signature)
  }

  return await prisma.company.update({
    where: { id: companyId },
    data: { signature: imageUrl },
  })
}