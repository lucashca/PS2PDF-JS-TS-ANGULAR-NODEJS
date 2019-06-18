function dateToMySQLFormat(date) {
    var year, month, day;
    year = String(date.getFullYear());
    month = String(date.getMonth() + 1);
    hours = String(date.getHours());
    min = String(date.getMinutes());
    seconds = String(date.getSeconds());
    milli = String(date.getMilliseconds());

    if (month.length == 1) {
        month = "0" + month;
    }
    day = String(date.getDate());
    if (day.length == 1) {
        day = "0" + day;
    }
   
    return year + "-" + month + "-" + day+"T"+hours+":"+min+":"+seconds+"."+milli+"Z";
}