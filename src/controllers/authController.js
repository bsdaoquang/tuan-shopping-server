/** @format */

const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const asyncHandle = require('express-async-handler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 587,
	auth: {
		user: process.env.USERNAME_EMAIL,
		pass: process.env.PASSWORD_EMAIL,
	},
});

const getJsonWebToken = async (email, id) => {
	const payload = {
		email,
		id,
	};
	const token = jwt.sign(payload, process.env.SECRET_KEY, {
		expiresIn: '7d',
	});

	return token;
};

const handleSendMail = async (val) => {
	try {
		await transporter.sendMail(val);

		return 'OK';
	} catch (error) {
		return error;
	}
};

const verification = asyncHandle(async (req, res) => {
	const { id } = req.body;

	try {
		const user = await UserModel.findById(id)
		const accesstoken = await getJsonWebToken(user.email, id)

		await UserModel.findByIdAndUpdate(id, {isVerify: true})

		res.status(200).json({
			message: 'Send verification code successfully!!!',
			data: {
				email: user.email,
				id: user._id,
				isVerify: true,
				accesstoken
			},
		});
	} catch (error) {
		res.status(401);
		throw new Error('Can not send email');
	}
});

const register = asyncHandle(async (req, res) => {
	const { email, fullname, password } = req.body;

	const existingUser = await UserModel.findOne({ email });

	if (existingUser) {
		res.status(400);
		throw new Error('User has already exist!!!');
	}

	const salt = await bcryp.genSalt(10);
	const hashedPassword = await bcryp.hash(password, salt);

	const newUser = new UserModel({
		email,
		fullname: fullname ?? '',
		password: hashedPassword,	
	});

	await newUser.save();

	const data = {
		from: `"Verification code" <${process.env.USERNAME_EMAIL}>`,
		to: email,
		subject: 'Verification email code',
		text: 'Your code to verification email',
		html: `<h1>${1234}</h1>`,
	};
 
	res.status(200).json({
		message: 'Register new user successfully',
		data: {
			email: newUser.email,
			id: newUser._id,
			isVerify: false,
			verificationCode: 1234
		},
	});
});

const login = asyncHandle(async (req, res) => {
	const { email, password } = req.body;

	const existingUser = await UserModel.findOne({ email });

	if (!existingUser) {
		res.status(403);
		throw new Error('User not found!!!');
	}

	const isMatchPassword = await bcryp.compare(password, existingUser.password);

	if (!isMatchPassword) {
		res.status(401);
		throw new Error('Email or Password is not correct!');
	}

	res.status(200).json({
		message: 'Login successfully',
		data: {
			id: existingUser.id,
			email: existingUser.email,
			accesstoken: await getJsonWebToken(email, existingUser.id),			
			isVerify: true
		},
	});
});

const forgotPassword = asyncHandle(async (req, res) => {
	const { email } = req.body;

	const randomPassword = Math.round(100000 + Math.random() * 99000);

	const data = {
		from: `"New Password" <${process.env.USERNAME_EMAIL}>`,
		to: email,
		subject: 'Verification email code',
		text: 'Your code to verification email',
		html: `<h1>${randomPassword}</h1>`,
	};

	const user = await UserModel.findOne({ email });
	if (user) {
		const salt = await bcryp.genSalt(10);
		const hashedPassword = await bcryp.hash(`${randomPassword}`, salt);

		await UserModel.findByIdAndUpdate(user._id, {
			password: hashedPassword,
			isChangePassword: true,
		})
			.then(() => {
				console.log('Done');
			})
			.catch((error) => console.log(error));

		await handleSendMail(data)
			.then(() => {
				res.status(200).json({
					message: 'Send email new password successfully!!!',
					data: [],
				});
			})
			.catch((error) => {
				res.status(401);
				throw new Error('Can not send email');
			});
	} else {
		res.status(401);
		throw new Error('User not found!!!');
	}
});

const handleLoginWithGoogle = asyncHandle(async (req, res) => {
	const userInfo = req.body;

	const existingUser = await UserModel.findOne({ email: userInfo.email });
	let user;
	if (existingUser) {
		await UserModel.findByIdAndUpdate(existingUser.id, {
			updatedAt: Date.now(),
		});
		user = { ...existingUser };
		user.accesstoken = await getJsonWebToken(userInfo.email, userInfo.id);

		if (user) {
			const data = {
				accesstoken: user.accesstoken,
				id: existingUser._id,
				email: existingUser.email,
				photo: existingUser.photoUrl,
				name: existingUser.name,
			};

			res.status(200).json({
				message: 'Login with google successfully!!!',
				data,
			});
		} else {
			res.sendStatus(401);
			throw new Error('fafsf');
		}
	} else {

		const salt = await bcrypt.genSalt(10)
		const hash = await bcrypt.hash('123456', salt)

		const newUser = new UserModel({
			email: userInfo.email,
			fullname: userInfo.name,
			password: hash,
			...userInfo,
		});
		await newUser.save();
		user = { ...newUser };
		user.accesstoken = await getJsonWebToken(userInfo.email, newUser.id);

		if (user) {
			res.status(200).json({
				message: 'Login with google successfully!!!',
				data: {
					accesstoken: user.accesstoken,
					id: user._id,
					email: user.email,
					photo: user.photoUrl,
					name: user.name,
				},
			});
		} else {
			res.sendStatus(401);
			throw new Error('fafsf');
		}
	}
});

module.exports = {
	register,
	login,
	verification,
	forgotPassword,
	handleLoginWithGoogle,
};
