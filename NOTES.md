## Crontab every 15mins
```sh
USER@raspi:~ $ crontab -e # saves to /var/spool/cron/crontabs/hennes
``` 
Add `15,30,45,0 * * * * /home/USER/workspace/fritz-dect-statistics/run.sh >> /home/USER/workspace/fritz-dect-statistics/run.log 2>&1`