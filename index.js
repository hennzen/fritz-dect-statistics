const fs = require('fs');
const nodemailer = require('nodemailer')

const Fritz = require('fritzdect-aha-nodejs').Fritz
const fritz = new Fritz(process.env.FRITZ_USERNAME, process.env.FRITZ_PWD, 'http://' + process.env.FRITZ_ADDRESS, {})

const currentDate = new Date()
// https://www.freeformatter.com/germany-standards-code-snippets.html
const germanDate = currentDate.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day:'2-digit' })
const germanTimeWoSeconds = currentDate.toLocaleTimeString('de-DE', { hour12: false }).substring(0,5)

async function getDectInfos() {
	const login = await fritz.login_SID().catch((e) => {
		console.log('fault calling login() ', e)
	})
	console.log('Login: ', login)
	
	const dect440XmlResp = await fritz.getDeviceInfos(process.env.AID_DECT440)
	console.log('DECT 440 XML response: ', dect440XmlResp)
	const dect200XmlResp = await fritz.getDeviceInfos(process.env.AID_DECT200)
	console.log('DECT 200 XML response: ', dect200XmlResp)
	
	const logout = await fritz.logout_SID()
	console.log('Logout: ', logout)
	
	const dect440Regex = /<celsius>(\d*)<\/celsius>.*<rel_humidity>(\d*)<\/rel_humidity>/g
	const dect440matchesArr = Array.from(dect440XmlResp.matchAll(dect440Regex))
	
	const dect200Regex = /<power>(\d*)<\/power>.*<energy>(\d*)<\/energy>.*<celsius>(\d*)<\/celsius>/g
	const dect200matchesArr = Array.from(dect200XmlResp.matchAll(dect200Regex))
	
	// console.log('matches: ', matchesArr[0])
	console.log('DECT 440 temperature: ', dect440matchesArr[0][1])
	console.log('DECT 440 humidity: ', dect440matchesArr[0][2])
	console.log('DECT 200 power: ', dect200matchesArr[0][1])
	console.log('DECT 200 energy: ', dect200matchesArr[0][2])
	console.log('DECT 200 temperature: ', dect200matchesArr[0][3])
	
	const dect440Temp = dect440matchesArr[0][1] // 10th degrees celsius
	const dect440Hum = dect440matchesArr[0][2] // humidity in %
	const dect200Power = dect200matchesArr[0][1] // milliwatts integer
	const dect200Energy = dect200matchesArr[0][2] // milliwatts-per-hour
	const dect200Temp = dect200matchesArr[0][3] // 10th degrees celsius
	
	return [dect440Temp, dect440Hum, dect200Power, dect200Energy, dect200Temp]
}

async function getWeather() {
	// use env variables for long lat and api key
	
	const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${process.env.OPENWEATHER_LATITUDE}&lon=${process.env.OPENWEATHER_LONGITUDE}&units=metric&lang=de&appid=${process.env.OPENWEATHER_API_KEY}`)
	const data = await response.json()

	const weather = data.weather[0].description
	const temperature = data.main.temp
	const humidity = data.main.humidity
	const rain = data.rain ? data.rain['1h'] : 0

	console.log('Openweathermap: ', { weather, temperature, humidity, rain })
	
	return { weather, temperature, humidity, rain }
}

async function writeToFile(dect440Temp, dect440Hum, dect200Power, dect200Energy, dect200Temp, weather, temperature, humidity, rain) {
	try {
		const fileName = 'statistics.csv'
		const newCsvLine =
			`"${germanDate} ${germanTimeWoSeconds}";` +
			`${dect440Hum};` +
			`${String(dect200Power / 1000).replace('.', ',')};` + 
			`${String(dect200Energy / 1000).replace('.', ',')};` +
			`${String(dect440Temp / 10).replace('.', ',')};` +
			`${String(dect200Temp / 10).replace('.', ',')};` + 
			`${weather};`+
			`${String(temperature).replace('.', ',')};` +
			`${String(humidity)};` +
			`${String(rain)};` +
			`\n`;
		fs.appendFileSync(fileName, newCsvLine, 'utf-8');
	} catch(err) {
		console.log('Error appending data to file in sync mode', err);
	}
}

async function sendEmail() {
	const smtpTransport = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		auth: {
			user: process.env.SMTP_USERNAME,
			pass: process.env.SMTP_PWD
		},
		secure: true
	})
	const message = {
		from: process.env.EMAIL_FROM,
		to: process.env.EMAIL_TO,
		subject: `FRITZ!DECT 440 / 200 ${process.env.ROOM} Info vom ${germanDate}`,
		text: process.env.EMAIL_BODY,
		attachments: [
			{ path: './statistics.csv' }
		]
	  }
	  await smtpTransport.sendMail(message)
	  console.log(`Sent email with subject "${message.subject}" and "statistics.csv" attached.`)
}

async function run() {
	let [dect440Temp, dect440Hum, dect200Power, dect200Energy, dect200Temp] = await getDectInfos()
	let { weather, temperature, humidity, rain } = await getWeather()
	
	await writeToFile(dect440Temp, dect440Hum, dect200Power, dect200Energy, dect200Temp, weather, temperature, humidity, rain)
	
	// Send an email at the end of the day, i.e. between 23:31 and 23:59.
	// This relies on cronjob running within this timeframe (15 minutes)
	if (germanTimeWoSeconds.split(':')[0] === '23' && parseInt(germanTimeWoSeconds.split(':')[1]) > 31 && parseInt(germanTimeWoSeconds.split(':')[1]) < 59) {
		await sendEmail()
	}
}

run()
