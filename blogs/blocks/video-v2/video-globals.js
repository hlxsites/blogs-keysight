/*
  this file contains non-module code
  it must be loaded globally for the video eloqua tracking stuff to work
*/
// eslint-disable-next-line
var Keysight = Keysight || {};
Keysight.EloquaSiteID = '609785623'; // The Site ID of your Eloqua Instance
Keysight.EloquaScript = 'https://img03.en25.com/i/elqCfg.min.js'; // Path to elqCfg.min.js
Keysight.FirstPartyCookieDomain = 'elq.keysight.com';
Keysight.LookupIdVisitor = '2c87fa21899d42ee804c59d83b50ba46'; // The ID of your Visitor Web Data Lookup
Keysight.VisitorUniqueField = 'V_ElqEmailAddress'; // Unique field's HTML Name from Visitor Lookup (usually V_Email_Address)
if (window.location.hostname.endsWith('.cn')) {
  Keysight.FirstPartyCookieDomain = 'elq.keysight.com.cn';
}
Keysight.elq_u_email = '';

// eslint-disable-next-line
var _elqQ = _elqQ || [];
_elqQ.push(['elqSetSiteId', Keysight.EloquaSiteID]);
_elqQ.push(['elqUseFirstPartyCookie', Keysight.FirstPartyCookieDomain]);
_elqQ.push(['elqTrackPageView', window.location.href]);

// eslint-disable-next-line no-unused-vars
function SetElqContent() {
  // eslint-disable-next-line no-undef
  Keysight.elq_u_email = GetElqContentPersonalizationValue(Keysight.VisitorUniqueField);
}
