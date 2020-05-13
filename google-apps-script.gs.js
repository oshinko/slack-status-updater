// ユーザーによって異なる定数
const CALENDAR_ID = 'xxxx';
const SLACK_USER_TOKEN = 'xxxx';
const A_EMOJI = ':xxxx:';
const B_EMOJI = ':xxxx:';

// 場合によって異なる定数
const A_PLACE = '職場';
const B_PLACE = '在宅';

const HOLIDAY_CALENDAR_ID = 'ja.japanese#holiday@group.v.calendar.google.com';

function doPost(e) {
  let range = SpreadsheetApp.getActive().getActiveSheet().getRange(1, 1, 1, 3);
  range.getCell(1, 1).setValue(e.parameter.place);
  range.getCell(1, 2).setValue(e.postData.getDataAsString());
  range.getCell(1, 3).setValue(new Date());
  return ContentService.createTextOutput('OK');
}

function update() {
  let headers = {authorization: 'Bearer ' + SLACK_USER_TOKEN};
  let profile = {status_text: '', status_emoji: ''};
  let presence = 'away';
  let now = new Date();
  let holiday = CalendarApp.getCalendarById(HOLIDAY_CALENDAR_ID)
                           .getEventsForDay(now)
                           .length;

  if (!holiday) {
    let range = SpreadsheetApp.getActive().getActiveSheet().getRange(1, 1, 1, 2);
    let place = range.getCell(1, 1).getValue();
    let action = range.getCell(1, 2).getValue();
    let scheduled = CalendarApp.getCalendarById(CALENDAR_ID)
                               .getEventsForDay(now)
                               .filter(x => x.getStartTime() <= now && now <= x.getEndTime())
                               .filter(x => x.getTitle().includes(place))
                               .length;

    if (scheduled && action == 'entered') {
      if (place == A_PLACE) {
        profile = {status_emoji: A_EMOJI}
      } else if (place == B_PLACE) {
        profile = {status_emoji: B_EMOJI}
      }
      presence = 'auto';
    }
  }

  UrlFetchApp.fetch('https://slack.com/api/users.profile.set', {
    method: 'post',
    headers: headers,
    payload: {profile: JSON.stringify(profile)}
  });

  UrlFetchApp.fetch('https://slack.com/api/users.setPresence', {
    method: 'post',
    headers: headers,
    payload: {presence: presence}
  });

  if (presence != 'away') {
    UrlFetchApp.fetch('https://slack.com/api/users.setActive', {
      method: 'post',
      headers: headers
    });
  }
}
