# About
This little script serves my particular need to track a DECT 440's humidity and temperature in a room with a dehumidifier connected to a DECT 200, while also collecting power consumption.

Unfortunately, Fritz!DECT 440 does not yet offer (daily) push mails that would let me collect its data like I am used to with Fritz!DECT 200 devices sending temperature and Watt data.

Using FritzBox' [HTTP-AHA-Interface](https://avm.de/fileadmin/user_upload/Global/Service/Schnittstellen/AHA-HTTP-Interface.pdf), [fritzdect-aha-nodejs](https://github.com/foxthefox/fritzdect-aha-nodejs), [Nodemailer](https://nodemailer.com/) and a Raspberry PI with a cronjob set up, this simple script accumulates measured values from DECT 440 and DECT 200 in a CSV file and sends it out via email every evening.

# Prerequisites
- Raspi (or any other Linux based machine running 24/7
- Node.js v20.6.0+ due to its native support for loading `.env` files
- regular SMTP email account

To install Node.js on Raspi, this line did the job for me ([source](https://gist.github.com/stonehippo/f4ef8446226101e8bed3e07a58ea512a#install-with-apt-using-nodesource-binary-distribution)).
```sh
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs
```

# Setup
1. `git clone` this repo and `npm i`
2. Create `.env` from `example.env` template and fill in the correct values where `AID_[DECT200|DECT440]` are your DECT's Actuator IDs
3. Modify path in `run.sh`

## Test-run directly
```bash
node --env-file=.env index.js
```

## Test-run via shell script
```sh
./run.sh
```
The shell script should have the executable bit checked out. If not, `chmod u+x run.sh` to add it.

# Setup crontab
`$ crontab -e`, add and modify this line
```
15,30,45,0 * * * * /home/USER/PATH/fritz-dect-statistics/run.sh >> /home/USER/PATH/fritz-dect-statistics/run.log 2>&1`
```
This runs the script every hour at 15, 30, 45 and 0 minutes (just like Fritz!Box' daily push mail CSVs).

This crontab setup should survive reboots.

# Good to know
- The script accumulates data within `statistics.csv`, adding a line every 15 minutes. 
- `statistics.csv` is checked in empty (with header only), then added to `.gitignore`, then removed from Git tracking via `git update-index --assume-unchanged statistics.csv`. To temporarily track it again to commit changes use `git update-index --no-assume-unchanged statistics.csv`
- Email is sent between 23:31 and 23:59, which means the crontab _must_ be configured to run within this time of the day, if you want to receive a daily email. Furthermore it simply attaches the current CSV file, which is growing constantly. Maybe improve this later.
