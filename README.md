# About
Fritz!DECT 440 (at the moment, that is August 2024), does not offer (daily) Push mails that would let me collect its temperature and humidity data like I am used to with Fritz!DECT 200 devices sending temperature and Watts data.

Using FritzBox' HTTP-AHA-Interface, [fritzdect-aha-nodejs](https://github.com/foxthefox/fritzdect-aha-nodejs), [Nodemailer](https://nodemailer.com/) and a Raspberry PI with Cronjobs set up, this simple script accumulates DECT 440's temperature and humidity values in a CSV file and sends it out vai email every evening.

# Prerequisites
A Raspi with Node.js v20.6.0+ due to its native support for loading `.env` files and a regular SMTP email account.

To install Node.js on Raspi, this line did the job for me ([source](https://gist.github.com/stonehippo/f4ef8446226101e8bed3e07a58ea512a#install-with-apt-using-nodesource-binary-distribution)).
```
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs
```

# Setup
1. `git clone` and `npm i`
2. Create `.env` from `example.env` template and fill in the correct values

## Test run directly
```bash
node --env-file=.env index.js
```

## Test run via shell script `run.sh`
```
./run.sh
```
The shell script should have the executable bit checked out. If not, `chmod u+x run.sh` to add it.

# Setup crontab
`$ crontab -e` and add and modify this line
```
15,30,45,0 * * * * /home/USER/PATH/fritz-dect-statistics/run.sh >> /home/USER/PATH/fritz-dect-statistics/run.log 2>&1`
```
This runs the script every hour at 15, 30, 45 and 0 minutes (just like Fritz!Box' daily push mail CSVs).

# Setup to run after reboot
TODO

# Good to know
The script accumulates data within `statistics.csv`, adding a line every 15 minutes. 

It sends the email between 23:31 and 23:59, which means the crontab _must_ be configured to run within this time, if you want to receive a daily email. Furthermore it simply attaches the current CSV file, which is growing constantly. But hey...
