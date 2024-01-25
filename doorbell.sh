#!/bin/bash

$NAME=$1
$MESSAGE=$2

eval "export $(egrep -z DBUS_SESSION_BUS_ADDRESS /proc/$(pgrep -u $LOGNAME xfce4-session)/environ)"

sixty_seconds_to_ms=600000

notify-send -t $sixty_seconds_to_ms -i $icon "Ding Dong!" "$NAME is at the door. $MESSAGE"
