#!/bin/bash

name=$1
message=$2
thirty_seconds=30000

eval "export $(egrep -z DBUS_SESSION_BUS_ADDRESS /proc/$(pgrep -u $LOGNAME xfce4-session)/environ)"

notify-send -t $thirty_seconds "$name is at the door." $message
