import React, { Component } from "react";

import { Platform } from 'react-native';

import FCM, {FCMEvent, RemoteNotificationResult, WillPresentNotificationResult, NotificationType} from "react-native-fcm";

import firebaseClient from  "./FirebaseClient";

export default class PushController extends Component {
  constructor(props) {
    super(props);
  }

  async componentDidMount() {

    // try{
    //   let result = await FCM.requestPermissions({badge: false, sound: true, alert: true});
    // } catch(e){
    //   console.error(e);
    // }
    
    // iOS: show permission prompt for the first call. later just check permission in user settings
    // Android: check permission in user settings
    FCM.requestPermissions({badge: false, sound: true, alert: true}).then(()=>console.log('granted')).catch(()=>console.log('notification permission rejected'));
        
    FCM.on(FCMEvent.RefreshToken, token => {
      console.log('refreshed token: ', token);
    });

    FCM.getFCMToken().then(token => {
      console.log("TOKEN (getFCMToken)", token);
      this.props.onChangeToken(token);
    });

    if(Platform.OS === 'ios'){
      FCM.getAPNSToken().then(token => {
        console.log("APNS TOKEN (getFCMToken)", token);
      });
    }

    FCM.getInitialNotification().then(notif => {
      console.log("INITIAL NOTIFICATION", notif)
    });

    this.notificationListener = FCM.on(FCMEvent.Notification, notif => {
      console.log("Notification", notif);
      // while app in foreground remember to handle notification data here!

      // Consider using presentingLocalNotification with remote data-only notifications to allow custom client-side logic.

      //   FCM.presentLocalNotification({
      //     id: "UNIQ_ID_STRING",                               // (optional for instant notification)
      //     title: "My Notification Title",                     // as FCM payload
      //     body: "My Notification Message",                    // as FCM payload (required)
      //     sound: "default",                                   // as FCM payload
      //     priority: "high",                                   // as FCM payload
      //     click_action: "ACTION",                             // as FCM payload
      //     badge: 10,                                          // as FCM payload IOS only, set 0 to clear badges
      //     number: 10,                                         // Android only
      //     ticker: "My Notification Ticker",                   // Android only
      //     auto_cancel: true,                                  // Android only (default true)
      //     large_icon: "ic_launcher",                           // Android only
      //     icon: "ic_launcher",                                // as FCM payload, you can relace this with custom icon you put in mipmap
      //     big_text: "Show when notification is expanded",     // Android only
      //     sub_text: "This is a subText",                      // Android only
      //     color: "red",                                       // Android only
      //     vibrate: 300,                                       // Android only default: 300, no vibration if you pass 0
      //     group: "group",                                     // Android only
      //     picture: "https://google.png",                      // Android only bigPicture style
      //     ongoing: true,                                      // Android only
      //     my_custom_data:'my_custom_field_value',             // extra data you want to throw
      //     lights: true,                                       // Android only, LED blinking (default false)
      //     show_in_foreground                                  // notification when app is in foreground (local & remote)
      // });

      if(notif.local_notification){
        return;
      }
      if(notif.opened_from_tray){
        return;
      }

      if(Platform.OS ==='ios'){
              //optional
              //iOS requires developers to call completionHandler to end notification process. If you do not call it your background remote notifications could be throttled, to read more about it see the above documentation link.
              //This library handles it for you automatically with default behavior (for remote notification, finish with NoData; for WillPresent, finish depend on "show_in_foreground"). However if you want to return different result, follow the following code to override
              //notif._notificationType is available for iOS platfrom
              switch(notif._notificationType){
                case NotificationType.Remote:
                  notif.finish(RemoteNotificationResult.NewData) //other types available: RemoteNotificationResult.NewData, RemoteNotificationResult.ResultFailed
                  break;
                case NotificationType.NotificationResponse:
                  notif.finish();
                  break;
                case NotificationType.WillPresent:
                  notif.finish(WillPresentNotificationResult.All) //other types available: WillPresentNotificationResult.None
                  break;
              }
      }

      this.refreshTokenListener = FCM.on(FCMEvent.RefreshToken, token => {
        console.log("TOKEN (refreshUnsubscribe)", token);
        this.props.onChangeToken(token);
      });

      // direct channel related methods are ios only
      // directly channel is truned off in iOS by default, this method enables it
      FCM.enableDirectChannel();
      this.channelConnectionListener = FCM.on(FCMEvent.DirectChannelConnectionChanged, (data) => {
        console.log('direct channel connected' + data);
      });
      setTimeout(function() {
        FCM.isDirectChannelEstablished().then(d => console.log(d));
      }, 1000);
    })
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    this.notificationListener.remove();
    this.refreshTokenListener.remove();
  }


  render() {
    return null;
  }
}
