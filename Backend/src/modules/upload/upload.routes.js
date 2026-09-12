import express from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { uploadProductImage, uploadLogo, uploadSignature } from './upload.service.js'
import {
  uploadProductImageController,
  uploadLogoController,
  uploadSignatureController,
} from './upload.controller.js'

const router = express.Router()

// Product image
router.post(
  '/product/:productId',
  authenticate,
  uploadProductImage.single('image'),
  uploadProductImageController
)

// Company logo
router.post(
  '/company/logo',
  authenticate,
  uploadLogo.single('logo'),
  uploadLogoController
)

// Company signature
router.post(
  '/company/signature',
  authenticate,
  uploadSignature.single('signature'),
  uploadSignatureController
)

export default router