## Crontab every 15mins
```sh
hennes@raspi:~ $ crontab -e # saves to /var/spool/cron/crontabs/hennes
``` 
Add `15,30,45,0 * * * * /home/hennes/workspace/fritz-dect-440-reporter/run.sh >> /home/hennes/workspace/fritz-dect-440-reporter/run.log 2>&1`