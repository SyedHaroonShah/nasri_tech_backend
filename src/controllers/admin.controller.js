import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/admin.model.js';

/* ===========================
   TOKEN GENERATOR
=========================== */
const generateAccessAndRefreshTokens = async (adminId) => {
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  const accessToken = admin.generateAccessToken();
  const refreshToken = admin.generateRefreshToken();

  admin.refreshToken = refreshToken;
  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
};

/* ===========================
   ADMIN LOGIN
=========================== */
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const admin = await Admin.findOne({ email });

  if (!admin || !admin.isActive) {
    throw new ApiError(401, 'Invalid credentials or inactive admin');
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    admin._id
  );

  const safeAdmin = await Admin.findById(admin._id).select(
    '-password -refreshToken'
  );

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { admin: safeAdmin }, 'Admin logged in successfully')
    );
});

/* ===========================
   ADMIN LOGOUT
=========================== */
const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(req.admin._id, {
    $unset: { refreshToken: 1 },
  });

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'Logged out successfully'));
});

/* ===========================
   REFRESH TOKEN
=========================== */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);

  const admin = await Admin.findById(decoded._id);

  if (!admin || admin.refreshToken !== incomingToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    admin._id
  );

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken },
        'Access token refreshed successfully'
      )
    );
});

export { loginAdmin, logoutAdmin, refreshAccessToken };
