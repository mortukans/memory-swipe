// Config plugin: Memory Swipe only schedules LOCAL notifications. expo-notifications'
// plugin still adds the push entitlement (aps-environment) and the remote-notification
// background mode, which our App Store provisioning profile deliberately does not
// include. Strip both so the archive signs and no push capability is declared.
const { withEntitlementsPlist, withInfoPlist } = require('expo/config-plugins');

module.exports = function withLocalNotificationsOnly(config) {
  config = withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
  config = withInfoPlist(config, (c) => {
    const modes = c.modResults.UIBackgroundModes;
    if (Array.isArray(modes)) {
      const kept = modes.filter((m) => m !== 'remote-notification');
      if (kept.length) c.modResults.UIBackgroundModes = kept;
      else delete c.modResults.UIBackgroundModes;
    }
    return c;
  });
  return config;
};
