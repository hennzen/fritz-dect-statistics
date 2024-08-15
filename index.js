const fs = require('fs');
const nodemailer = require('nodemailer')

const Fritz = require('fritzdect-aha-nodejs').Fritz
const fritz = new Fritz(process.env.FRITZ_USERNAME, process.env.FRITZ_PWD, 'http://' + process.env.FRITZ_ADDRESS, {})

const currentDate = new Date()
// https://www.freeformatter.com/germany-standards-code-snippets.html
const germanDate = currentDate.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day:'2-digit' })
const germanTime = currentDate.toLocaleTimeString('de-DE', { hour12: false })

async function getTempAndHumidity() {
	const login = await fritz.login_SID().catch((e) => {
		console.log('fault calling login() ', e)
	})
	console.log('login', login)
	
	const devicelistinfosXml = await fritz.getDeviceInfos(process.env.AID)
	console.log('XML response: ', devicelistinfosXml)
	const logout = await fritz.logout_SID()
	console.log('logout', logout)
	
	const regex = /<celsius>(\d*)<\/celsius>.*<rel_humidity>(\d*)<\/rel_humidity>/g
	const matchesArr = Array.from(devicelistinfosXml.matchAll(regex))
	
	// console.log('matches: ', matchesArr[0])
	console.log('temp: ', matchesArr[0][1])
	console.log('humidity: ', matchesArr[0][2])
	
	const temp = matchesArr[0][1]
	const hum = matchesArr[0][2]
	
	return [temp, hum]
}

async function writeToFile(temp, hum) {
	// https://geshan.com.np/blog/2022/04/nodejs-append-to-file/#sync-file-append-using-node.js
	try {
		const fileName = 'statistics.csv'
		const newCsvLine = `${germanDate};${germanTime};${temp};${hum};\n`
		fs.appendFileSync(fileName, newCsvLine, 'utf-8');
	} catch(err) {
		console.log('Error appending data to file in sync mode', err);
	}
}

async function sendEmail() {
	const smtpTransport = nodemailer.createTransport({
		host: 'smtp.goneo.de',
		port: 465,
		auth: {
			user: process.env.SMTP_USERNAME,
			pass: process.env.SMTP_PWD
		},
		secure: true
	})
	const message = {
		from: process.env.EMAIL_FROM,
		to: process.env.EMAIL_TO,
		subject: `FRITZ!DECT 440 ${process.env.ROOM} (AID ${process.env.AID}) Info vom ${germanDate}`,
		text: process.env.EMAIL_BODY,
		attachments: [
			{ path: './statistics.csv' }
		]
	  }
	  await smtpTransport.sendMail(message)
	  console.log(`Sent email with subject "${message.subject}" and "statistics.csv" attached.`)
}

async function run() {
	let [temperature, humidity] = await getTempAndHumidity()
	await writeToFile(temperature, humidity)
	
	// Send an email at the end of the day, i.e. between 23:31 and 23:59.
	// This relies on cronjob running within this timeframe (15 minutes)
	if (germanTime.split(':')[0] === '23' && parseInt(germanTime.split(':')[1]) > 31 && parseInt(germanTime.split(':')[1]) < 59) {
		await sendEmail()
	}
}

run()
