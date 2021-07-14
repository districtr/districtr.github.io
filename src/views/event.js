import { svg, html, render } from "lit-html";
import { listPlacesForState, placeItems } from "../components/PlacesList";
import { startNewPlan } from "../routes";

import { geoPath } from "d3-geo";
import { geoAlbersUsaTerritories } from "geo-albers-usa-territories";

const stateForEvent = {
  test: 'Pennsylvania',
  fyi: 'North Carolina',
  'unca-forsyth': 'North Carolina',
  buncombe: 'North Carolina',
  'common cause md ss': 'Maryland',
  'commoncause md ss': 'Maryland',
  'cc-md-ss': 'Maryland',
  'cc md ss': 'Maryland',
  'cc-nm-abq': 'New Mexico',
  centralsan: 'California',
  'mggg-nm': 'New Mexico',
  'pmc-demo': 'Wisconsin',
  pmc: 'Wisconsin',
  'pmc-districts': 'Wisconsin',
  powercoalition: 'Louisiana',
  'open-maps': 'Ohio',
  'fair-districts-oh': 'Ohio',
  'colorado-cc': 'Colorado',
  ttt: 'Colorado',
  nsfm: 'Wisconsin',
  'towsonu-baltimore': 'Maryland',
  fairmapstexas: 'Texas',
  'missouri-mapping': 'Missouri',
  'ourmapsmn': 'Minnesota',
  'micrc': 'Michigan',
  mesaaz: 'Arizona',
  slo_county: 'California',
  ourmapsne: 'Nebraska',
  prjusd: 'California',
  hia: 'Texas',
  onelovemi: 'Michigan',
  saccounty: 'California',
  saccountymap: 'California',
  sonomaco: 'California',
  pasadena2021: 'California',
  goleta: 'California',
  sbcounty: 'California',
  'ks-fairmaps': 'Kansas',
  'galeo': 'Georgia',
};

const validEventCodes = {
  test: 'pennsylvania',
  fyi: 'forsyth_nc',
  'unca-forsyth': 'forsyth_nc',
  buncombe: 'buncombe',
  'common cause md ss': 'maryland',
  'commoncause md ss': 'maryland',
  'cc-md-ss': 'maryland',
  'cc md ss': 'maryland',
  'cc-nm-abq': 'new_mexico',
  centralsan: 'ccsanitation2',
  'mggg-nm': ['new_mexico', 'new_mexico_bg', 'santafe'],
  'pmc-demo': ['wisconsin2020', 'wisconsin'],
  pmc: ['wisconsin2020', 'wisconsin'],
  'pmc-districts':['wisconsin2020','wisconsin'],
  powercoalition: 'batonrouge',
  'open-maps': ['ohio', 'akroncanton', 'cincinnati', 'clevelandeuclid', 'columbus', 'dayton', 'limaoh', 'mansfield', 'portsmouthoh', 'toledo', 'youngstown', 'ohcentral', 'ohakron', 'ohcin', 'ohcle', 'ohse', 'ohtoledo'],
  'fair-districts-oh': ['ohio', 'akroncanton', 'cincinnati', 'clevelandeuclid', 'columbus', 'dayton', 'limaoh', 'mansfield', 'portsmouthoh', 'toledo', 'youngstown', 'ohcentral', 'ohakron', 'ohcin', 'ohcle', 'ohse', 'ohtoledo'],
  'colorado-cc': 'colorado',
  ttt: [],
  nsfm: 'wisconsin2020',
  'towsonu-baltimore': 'baltimore',
  fairmapstexas: 'texas',
  'missouri-mapping': 'missouri',
  'ourmapsmn': ['minnesota','olmsted','washington_mn','stlouis_mn','rochestermn'],
  'micrc': 'michigan',
  mesaaz: 'mesaaz',
  slo_county: 'sanluiso',
  ourmapsne: 'nebraska',
  prjusd: 'pasorobles',
  'hia': ['texas', 'harristx', 'houston'],
  onelovemi: 'michigan',
  saccounty: 'sacramento',
  saccountymap: 'sacramento',
  pasadena2021: 'ca_pasadena',
  sonomaco: 'ca_sonoma',
  'ks-fairmaps': 'kansas',
  'galeo': 'hall_ga',
  goleta: 'ca_goleta',
  sbcounty: 'ca_santabarbara',
};

const blockPlans = {
  powercoalition: [9439, 9446],
};

const unitTypes = {
  "pmc-demo": {no: '2011 Wards'},
  pmc: {no: '2011 Wards'},
  'pmc-districts': {no: ['2011 Wards', 'Block Groups']},
  powercoalition: {no: 'Precincts'},
  "open-maps": {no: 'Precincts'},
  "fair-districts-oh": {no: 'Precincts'},
  grns: {no: '2011 Wards'},
  'missouri-mapping': {no: 'Precincts'},
  hia: {no: 'Precincts'}
};

const unitCounts = {
  'unca-forsyth': 101,
  centralsan: 5086,
  buncombe: 67,
  'towsonu-baltimore': 653,
  prjusd: 2818,
  'pmc-districts':7078
};

const coi_events = [
  "fyi",
  'common cause md ss',
  'commoncause md ss',
  'cc-md-ss',
  'cc md ss',
  'cc-nm-abq',
  // 'santafe',
  'mggg-nm',
  'pmc-demo',
  'pmc',
  'powercoalition',
  'open-maps',
  'fair-districts-oh',
  'colorado-cc',
  'nsfm',
  'fairmapstexas',
  'missouri-mapping',
  'ttt',
  'ourmapsmn',
  'micrc',
  'mesaaz',
  'slo_county',
  'ourmapsne',
  'onelovemi',
  'ks-fairmaps'
];

const hybrid_events = [
  // 'mesaaz',
  'hia',
  'saccounty',
  'saccountymap',
  'sonomaco',
  'pasadena2021',
  'goleta',
  'sbcounty',
];

const portal_events = [
  'open-maps',
  'fyi',
];

const eventDescriptions = {
  test: 'this is a test of the event descriptions',
  'unca-forsyth': 'Welcome to your class page UNC Asheville students! We\'re excited for you to start exploring Forsyth County with Districtr. <a href="/guide">Click here</a> for a tutorial.',
  buncombe: 'Welcome to the event page for Buncombe County!',
  'common cause md ss': 'Welcome to the event page for the Common Cause Maryland project!',
  'commoncause md ss': 'Welcome to the event page for the Common Cause Maryland project!',
  'cc-md-ss': 'Welcome to the event page for the Common Cause Maryland project!',
  'cc md ss': 'Welcome to the event page for the Common Cause Maryland project!',
  'cc-nm-abq': 'Welcome to the event page for the Common Cause New Mexico project!',
  centralsan: 'Welcome to the event page for the Central Contra Costa County Sanitary District. This page uses Districtr, a community web tool provided by the MGGG Redistricting Lab. <a href="/guide">Click here</a> for a Districtr tutorial.',
  'mggg-nm': 'Welcome to the event page for the MGGG - New Mexico demo!',
  'pmc-demo': 'Welcome to the COI collection page for Wisconsin (DEMO)',
  pmc: "<p>Welcome to the Community of Interest public mapping page for the People’s Maps Commission (PMC) of Wisconsin. The Commission is a group of people that will hear directly from folks across the state and draw fair, impartial maps for the Legislature to take up in 2021. Click <a href='https://govstatus.egov.com/peoplesmaps' target='_blank'>here</a> to learn more about their work.</p>\
  <p>As part of the redistricting process, the Commission will consider Communities of Interest, or COIs, groups with shared interests that should be given special consideration. To let the Commission know where communities are and what common concerns bind them together, share your map on this mapping page or submit your map through the Commission’s public submission portal <a href='https://govstatus.egov.com/peoplesmaps/contact-commission' target='_blank'>here</a>.</p>\
  <p><b>To display your map on this page, be sure the tag \"PMC\" is filled out after you've clicked \"Save\" to share the map.</b></p>",
  'pmc-districts': "<p>Welcome to the District-Drawing public mapping tag page for the People’s Maps Commission (PMC) of Wisconsin. The Commission is a group of people that will hear directly from folks across the state and draw fair, impartial maps for the Legislature to take up in 2021. Click <a href='https://govstatus.egov.com/peoplesmaps' target='_blank'>here</a> to learn more about their work.</p>\
  <p><b>To display your map on this page, be sure the tag \ “PMC-districts\” is filled out after you’ve clicked \ “Save\” to share the map.</b></p>",
  powercoalition: 'Welcome to the greater Baton Rouge event page for the <a href="https://powercoalition.org/">Power Coalition</a>. This page is set up to let you identify your communities of interest.<br/><br/>Show us the important places and tell us the stories that you want the mapmakers to see when they draw the lines!',
  'open-maps': "<p>Welcome to the public mapping page for OPEN Maps!</p>\
  <p>OPEN Maps (“Ohio Public Engagement in Neighborhoods” mapping project) is a joint project between the MGGG Redistricting Lab at the Tisch College of Civic Life and the Ohio State University’s Kirwan Institute for the Study of Race and Ethnicity.</p>\
  <p>Our goal is to <strong>collect over 500 community maps and narratives</strong>. Our team will synthesize these maps in a final report that we will submit to Ohio's politician redistricting commission.</p>\
  <p>Ohio residents, you can participate by drawing and describing Ohio communities in one of our modules. When you click “Save” to share your map, <strong>enter the tag “OPEN-maps”</strong> to post your map on this public submission page!</p>\
  <p>Visit our <a href='https://districtr.org/training' target='_blank'>training resources</a> page to learn more about Communities of Interest and prompts that you can answer to describe your community. Join one of our Districtr train-the-trainers to learn more about why communities matter and how to collect useful narratives.</p>",
  'fair-districts-oh': 'Welcome to the event page for Fair Districts Ohio!',
  'colorado-cc': 'Welcome to the event page for Colorado Common Cause!',
  ttt: 'Training the Trainers',
  nsfm: "<p>Welcome to the <a href='https://northshorefairmaps.com' target='_blank'>North Shore Fair Maps</a> mapping page. You can help Wisconsin’s <a href='https://govstatus.egov.com/peoplesmaps' target='_blank'>People’s Maps Commission</a> #EndGerrymandering! Please draw a map that shows us your “<a href='https://docs.google.com/document/d/15CFn85psZkJvGfgZeQwRGS6BMF1YJgEsTblZuwaBhzg/edit' target='_blank'>community of interest</a>.” Your map will tell the Commission what's on the ground and relevant. Your map will be added to thousands of other maps, computers will do their magic, and before you know it, new Wisconsin voting maps will be created. With so many people involved in map-making, there is no guaranty that YOUR map will rule the day, but it will be considered. It will count. And because of you and others like you, Wisconsin's new voting maps will make sure that everyone’s vote gets counted … and counts. Learn more about how you can help #EndGerrymandering at <a href='http://www.northshorefairmaps.com' target='_blank'>www.NorthShoreFairMaps.com</a>.</p>",
  'towsonu-baltimore': 'Welcome to the event page for Towson University',
  fairmapstexas: 'Welcome to the event page for Fair Maps Texas!',
  'missouri-mapping': "<p>You can help us map Missouri! When you click “Save” to share your map, <strong>enter the tag “missouri-mapping”</strong> to post your map on this public submission page. You can also enter it along with written comments at <a href='https://research.typeform.com/to/zH14rNfF' target='_blank'>our portal</a>.</p>",
  'ourmapsmn': "<p>Welcome to the Our Maps Minnesota Redistricting Campaign Mapping page! The Our Maps MN Campaign is committed to a community-focused, accessible, and transparent redistricting process in Minnesota. Through this campaign we aim to:</p>\
   <ul><li>Empower historically under-represented BIPOC communities and other stakeholders across the state to engage in the redistricting process to ensure they are seen and visible in our political boundaries, increasing their ability to elect officials that truly represent and listen to the community; and</li>\
   <li>Achieve fair Congressional and state legislative district maps that reflect input from communities of interest, particularly BIPOC communities</li></ul>\
   <p>As part of this we work to empower historically under-represented BIPOC communities and other stakeholders across Minnesota to participate in the redistricting process to ensure they are seen and visible in our political boundaries, increasing their ability to elect officials that truly represent and listen to the community.</p>\
   <p>A community-focused, accessible, and transparent redistricting process is critical to ensuring that our communities have equitable representation and influence in our democracy so we too can thrive. This page is both the starting point and the home for creation of community maps developed through the Our Maps Minnesota Campaign. Through this campaign we work with communities to define themselves through the connections, issues and policies that are most important to them, and then enable them to create maps showing their communities for inclusion in our political maps.</p>",
   'micrc': "Welcome to the public mapping page for the Michigan Independent Citizen's Redistricting Commission!",
   mesaaz: "<p>Every 10 years, Mesans get the chance to help reshape their City Council districts following the decennial U.S. Census. It’s important to know about the communities of Mesa so that the district lines can amplify the voices of residents.</p>\
      <p>Examples of communities can include homeowner associations (HOAs) or registered neighborhoods,  areas where many residents speak the same language, or even areas where the residents use the same community facilities. It’s basically any part of Mesa where people have a common interest that needs a voice in government.</p>\
      <p><strong>Mesa, we need your help to build a community map! Please use this tool to identify the boundaries of your community and share what makes it a community.</strong></p>\
      <p>Every map submitted will be carefully reviewed by the Mesa residents charged with redrawing the Mesa City Council District Map. For more information, visit <a href='https://www.mesaaz.gov/government/advisory-boards-committees/redistricting-commission' target='_blank'>Mesa’s Citizen Redistricting Commission</a>.</p>\
      <p>Get started by clicking the orange button. To share your map, click “Save” in the upper right corner of the mapping module. To pin your map to this page, be sure the tag “MesaAZ” (any capitalization) is entered.</p>",
    slo_county: "<p>Every 10 years, Californians get the chance to help reshape their Supervisor Board districts following the decennial U.S. Census. It’s important to know about communities so that the district lines can amplify the voices of residents.</p>\
       <p>Examples of communities can include homeowner associations (HOAs) or registered neighborhoods,  areas where many residents speak the same language, or even areas where the residents use the same community facilities. It’s basically any part where people have a common interest that needs a voice in government.</p>\
       <p><strong>We need your help to build a community map! Please use this tool to identify the boundaries of your community and share what makes it a community.</strong></p>\
       <p>Every map submitted will be carefully reviewed by the residents charged with redrawing the Supervisorial District Map. For more information, visit link.</p>\
       <p>Get started by clicking the orange button. To share your map, click “Save” in the upper right corner of the mapping module. To pin your map to this page, be sure the tag “SLO_County” (any capitalization) is entered.</p>",
   ourmapsne: "Welcome to the event page for Nebraska!",
    prjusd: "<p>Welcome to the public mapping page for the Paso Robles Joint Unified School District (“PRJUSD”) Board of Education. PRJUSD is transitioning from at-large elections to by-area elections to be implemented for the November 2022 election.  In by-area elections, PRJUSD will consist of 7 voting areas that are roughly equal in population.  Board members will be elected from each of the seven areas only by voters who reside within the respective areas.  Board members will be required to reside within the area from which they are elected.  For example, Area A’s representative on the PRJUSD Board will need to reside within Area A and is only elected by voters who reside within  Area A.</p>\
    <p>As part of the creation of voting areas, PRJUSD is seeking public input on what these voting areas should look like.  To let the School District know what you think the maps should look like, you can create your own map utilizing this website or you can take one of the previously created maps and modify it. \
    <a href='https://districtr.org/guide' target='_blank'>Click here</a> for a tutorial.</p>\
    <p><strong>To display your map on this page, be sure the tag \"PRJUSD\" is filled out after you've clicked \"Save\" to share the map.</strong></p>",
   hia: "Welcome to the event page for Houston in Action!",
   onelovemi: "<p>Welcome to the event page for One Love Michigan! Here is a message from the organization:</p>\
                <p>We know that historically, maps have been used as a tool for racism and white supremacy, between taking land from indigenous people to redlining and racial gerrymandering, so this is a moment to reclaim maps for empowerment. We need YOU to get involved!!! Join One Love Global in drawing maps of your community to ensure that they are kept intact during the redistricting process.</p>",
   saccounty: "<p>Welcome to the Districtr Community of Interest public mapping tool for Sacramento County’s 2021 supervisorial redistricting.<p>\
      <p>As part of the redistricting process, the California FAIR MAPS Act includes \
      neighborhoods and “Communities of Interest” as important considerations. California law defines Communities of Interest as “a \
      population that shares common social or economic interests that should \
      be included within a single district for purposes of its effective and fair \
      representation.”</p>\
      <p>To let the County know about your community and what brings it together, \
share your map and your story using this tool now.</p>\
      <p><strong>To display your map on this page, be sure the tag &quot;SacCounty&quot; is filled \
out after you've clicked &quot;Save&quot; to share the map.</strong></p>\
<p>To learn more about the County’s redistricting effort, visit \
  <a href='https://www.saccounty.net' target='_blank'>www.saccounty.net</a>.</p>",
  sonomaco: "<p>Welcome to the Districtr Community of Interest public mapping tool for Sonoma County’s 2021 supervisorial redistricting.<p>\
     <p>As part of the redistricting process, the California FAIR MAPS Act includes \
     neighborhoods and “Communities of Interest” as important considerations. California law defines Communities of Interest as “a \
     population that shares common social or economic interests that should \
     be included within a single district for purposes of its effective and fair \
     representation.”</p>\
     <p>To let the County know about your community and what brings it together, \
share your map and your story using this tool now.</p>\
     <p><strong>To display your map on this page, be sure the tag &quot;SonomaCo&quot; is filled \
out after you've clicked &quot;Save&quot; to share the map.</strong></p>",
pasadena2021: "<p>Welcome to the Districtr Community of Interest public mapping tool for Pasadena's 2021 city council redistricting.<p>\
   <p>As part of the redistricting process, the California FAIR MAPS Act includes \
   neighborhoods and “Communities of Interest” as important considerations. California law defines Communities of Interest as “a \
   population that shares common social or economic interests that should \
   be included within a single district for purposes of its effective and fair \
   representation.”</p>\
   <p>To let the City know about your community and what brings it together, \
share your map and your story using this tool now.</p>\
   <p><strong>To display your map on this page, be sure the tag &quot;Pasadena2021&quot; is filled \
out after you've clicked &quot;Save&quot; to share the map.</strong></p>",
  saccountymap: "<p>Welcome to the Districtr Community of Interest public mapping tool for Sacramento County’s 2021 supervisorial redistricting.<p>\
     <p>As part of the redistricting process, the California FAIR MAPS Act includes \
     neighborhoods and “Communities of Interest” as important considerations. California law defines Communities of Interest as “a \
     population that shares common social or economic interests that should \
     be included within a single district for purposes of its effective and fair \
     representation.</p>\
     <p>To let the County know about your community and what brings it together, \
share your map and your story using this tool now.</p>\
     <p><strong>To display your map on this page, be sure the tag &quot;SacCounty&quot; is filled \
out after you've clicked &quot;Save&quot; to share the map.</strong></p>\
<p>To learn more about the County’s redistricting effort, visit \
 <a href='https://www.saccounty.net' target='_blank'>www.saccounty.net</a>.</p>",
  'ks-fairmaps': 'Welcome to the event page for Fair Maps Kansas!',
  'galeo': 'Welcome to the event page for GALEO!',

  goleta: "<p>Welcome to the Districtr Community of Interest public mapping tool for Goleta's 2021 city council redistricting.<p>\
     <p>As part of the redistricting process, the California FAIR MAPS Act includes \
     neighborhoods and “Communities of Interest” as important considerations. California law defines Communities of Interest as “a \
     population that shares common social or economic interests that should \
     be included within a single district for purposes of its effective and fair \
     representation.”</p>\
     <p>To let the City know about your community and what brings it together, \
  share your map and your story using this tool now.</p>\
     <p><strong>To display your map on this page, be sure the tag &quot;Goleta&quot; is filled \
  out after you've clicked &quot;Save&quot; to share the map.</strong></p>",
  sbcounty: "<p>Welcome to the Districtr Community of Interest public mapping tool for Santa Barbara's 2021 county supervisorial redistricting.<p>\
     <p>As part of the redistricting process, the California FAIR MAPS Act includes \
     neighborhoods and “Communities of Interest” as important considerations. California law defines Communities of Interest as “a \
     population that shares common social or economic interests that should \
     be included within a single district for purposes of its effective and fair \
     representation.”</p>\
     <p>To let the County know about your community and what brings it together, \
  share your map and your story using this tool now.</p>\
     <p><strong>To display your map on this page, be sure the tag &quot;SBCounty&quot; is filled \
  out after you've clicked &quot;Save&quot; to share the map.</strong></p>",

};

const longAbout = {
  'cc-nm-abq': ["MGGG has partnered with Common Cause, a nonprofit good-government organization championing voting rights and redistricting reform, to collect Communities of Interest in Albuquerque, New Mexico. Participants in Albuquerque will join the event virtually to engage in a discussion about community led by National Redistricting Manager, Dan Vicuña, and Census and Mass Incarceration Project Manager, Keshia Morris.",
      "The team will use Districtr, a free webtool developed by MGGG at Tufts University, to map important places and community boundaries. The data for this event were obtained from the US Census Bureau. The block group shapefiles were downloaded from the Census's TIGER/Line Shapefiles, and demographic information from the 2010 Decennial Census was downloaded at the block level from the Census API.",
      "We welcome questions and inquiries about the tool and our work. Reach out to us at <a href=\"mailto:contact@mggg.org\">contact@mggg.org</a> if you are interested in working with us."],
  centralsan: [
    "The <a href='https://www.centralsan.org/'>Central Contra Costa Sanitary District</a> (Central San) is transitioning from an at-large election system to an area-based election system. Under the current at-large election system, all five members of the Board of Directors are chosen by constituents from the District’s entire service area. Under area-based elections, the District will be divided into five separate election areas—called “divisions”—and voters residing in each area will select one representative to serve on the Board.",
    "Central San invites all residents of the District to provide input on the options under consideration, and to submit their own maps for consideration."],
  mesaaz: [
    "This mapping module displays 2015-2019 American Community Survey data disaggregated onto Census blocks. The data was prepared by Redistricting Partners. For the last decade, Redistricting Partners has supported cities, community college districts, school boards, hospital districts, water boards, and other special districts. To learn more about their team <a href='https://redistrictingpartners.com/about/'>click here</a>.",
  ],
  slo_county: [
    "This mapping module displays 2015-2019 American Community Survey data disaggregated onto Census blocks. The data was prepared by Redistricting Partners. For the last decade, Redistricting Partners has supported cities, community college districts, school boards, hospital districts, water boards, and other special districts. To learn more about their team <a href='https://redistrictingpartners.com/about/'>click here</a>.",
  ],
  prjusd: [
    "This mapping module displays 2019 American Community Survey data disaggregated onto Census blocks. The data was prepared by <a href='https://www.coopstrategies.com' target='_blank'>Cooperative Strategies</a>. Cooperative Strategies is a comprehensive planning and demographics firm that has been retained by the School District to assist in its transition from at-large to by-area elections. Over the last decade, Cooperative Strategies has assisted more than 50 school districts across California draw their voting areas.",
  ],
  saccounty: [
    "Sacramento County Board of Supervisor District Boundaries must be redrawn every 10 years using U.S. Census data in order to make the five districts as equal in population as possible and that each member represents about the same number of constituents. \
    The County encourages residents to participate by suggesting neighborhood and community of interest maps of areas that should be kept undivided, and full five-district map suggestions for the whole county. \
    For more information, please visit <a href='https://www.saccounty.net/Redistricting/' target='_blank'>www.saccounty.net/Redistricting/</a>",
    "This mapping module displays projected 2020 population based on the American Community Survey data disaggregated onto Census blocks. \
    The data was prepared by National Demographics Corporation. To learn more about their team click <a href='https://www.ndcresearch.com/about-us/' target='_blank'>here</a>.",
  ],
  sonomaco: [
    "Sonoma County Board of Supervisor District Boundaries must be redrawn every 10 years using U.S. Census data in order to make the five districts as equal in population as possible and that each member represents about the same number of constituents. \
    The County encourages residents to participate by suggesting neighborhood and community of interest maps of areas that should be kept undivided, and full five-district map suggestions for the whole county.",
    "This mapping module displays projected 2020 population based on the American Community Survey data disaggregated onto Census blocks. \
    The data was prepared by National Demographics Corporation. To learn more about their team click <a href='https://www.ndcresearch.com/about-us/' target='_blank'>here</a>.",
  ],
  pasadena2021: [
    "City of Pasadena City Council District Boundaries must be redrawn every 10 years using U.S. Census data in order to make the seven districts as equal in population as possible and that each member represents about the same number of constituents. \
    The City encourages residents to participate by suggesting neighborhood and community of interest maps of areas that should be kept undivided, and full five-district map suggestions for the whole county.",
    "This mapping module displays projected 2020 population based on the American Community Survey data disaggregated onto Census blocks. \
    The data was prepared by National Demographics Corporation. To learn more about their team click <a href='https://www.ndcresearch.com/about-us/' target='_blank'>here</a>.",
  ],
  saccountymap: [
    "Sacramento County Board of Supervisor District Boundaries must be redrawn every 10 years using U.S. Census data in order to make the five districts as equal in population as possible and that each member represents about the same number of constituents. \
    The County encourages residents to participate by suggesting neighborhood and community of interest maps of areas that should be kept undivided, and full five-district map suggestions for the whole county. \
    For more information, please visit <a href='https://www.saccounty.net/Redistricting/' target='_blank'>www.saccounty.net/Redistricting/</a>",
    "This mapping module displays projected 2020 population based on the American Community Survey data disaggregated onto Census blocks. \
    The data was prepared by National Demographics Corporation. To learn more about their team click <a href='https://www.ndcresearch.com/about-us/' target='_blank'>here</a>.",
  ],
  goleta: [
    "City of Goleta City Council District Boundaries must be redrawn every 10 years using U.S. Census data in order to make the four districts as equal in population as possible and that each member represents about the same number of constituents. \
    The City encourages residents to participate by suggesting neighborhood and community of interest maps of areas that should be kept undivided, and full five-district map suggestions for the whole county.",
    "This mapping module displays projected 2020 population based on the American Community Survey data disaggregated onto Census blocks. \
    The data was prepared by National Demographics Corporation. To learn more about their team click <a href='https://www.ndcresearch.com/about-us/' target='_blank'>here</a>.",
  ],
  sbcounty: [
    "Santa Barbara County Supervisorial District Boundaries must be redrawn every 10 years using U.S. Census data in order to make the five districts as equal in population as possible and that each member represents about the same number of constituents. \
    The County encourages residents to participate by suggesting neighborhood and community of interest maps of areas that should be kept undivided, and full five-district map suggestions for the whole county.",
    "This mapping module displays projected 2020 population based on the American Community Survey data disaggregated onto Census blocks. \
    The data was prepared by National Demographics Corporation. To learn more about their team click <a href='https://www.ndcresearch.com/about-us/' target='_blank'>here</a>.",
  ],
};

const proposals_by_event = {
  centralsan: true,
  'pmc-districts': true,
  prjusd: true,
};

export default () => {
    const og_eventCode = ((window.location.hostname === "localhost")
        ? window.location.search.split("event=")[1].split("&")[0]
        : window.location.pathname.split("/").slice(-1)[0]
    );
    const eventCode = og_eventCode.toLowerCase();

    if (validEventCodes[eventCode]) {
        document.getElementById("eventHeadline").innerText = og_eventCode;
        if (coi_events.includes(eventCode)) {
            document.getElementById("introExplain").innerText = "Map Your Community";
            document.getElementById("introExplain").style.display = "block";
        }

        if (["mesaaz", "slo_county"].includes(eventCode)) {
            document.getElementById("partnership-icons").style.display = "block";
            if (eventCode === "mesaaz") {
              document.getElementById("partner-link-a").href = "https://www.mesaaz.gov";
              document.getElementById("partnership-a").src = "/assets/partners-mesa.jpeg";
            } else if (eventCode === "slo_county") {
              document.getElementById("partner-link-a").href = "https://www.slocounty.ca.gov/";
              document.getElementById("partnership-a").src = "/assets/partners-slo.png";
            }
            document.getElementById("partner-link-b").href = "https://redistrictingpartners.com";
            document.getElementById("partnership-b").src = "/assets/partners-rp.png";
        } else if (["saccounty", "saccountymap", "sonomaco", "pasadena2021", "sbcounty", "goleta"].includes(eventCode)) {
            document.getElementById("partnership-icons").style.display = "block";
            document.getElementById("partnership-b").src = "/assets/partners-ndc.png";
            document.getElementById("partner-link-b").href = "https://www.ndcresearch.com/";
            if (eventCode === "sonomaco") {
              document.getElementById("partner-link-a").href = "https://sonomacounty.ca.gov";
              document.getElementById("partnership-a").src = "/assets/partners-sonoma.png";
            } else if (eventCode === "pasadena2021") {
              document.getElementById("partner-link-a").href = "https://www.cityofpasadena.net/";
              document.getElementById("partnership-a").src = "/assets/partners-pasadena.png";
              document.getElementById("partnership-a").style.background = "#00275d";
            } else if (eventCode === "sbcounty") {
              document.getElementById("partner-link-a").href = "https://www.countyofsb.org/";
              document.getElementById("partnership-a").src = "/assets/partners-santabarbara.png";
              document.getElementById("partnership-a").style.background = "#22a8c4";
            } else if (eventCode === "goleta") {
              document.getElementById("partner-link-a").href = "https://www.cityofgoleta.org/";
              document.getElementById("partnership-a").src = "/assets/partners-goleta.png";
            } else {
              document.getElementById("partner-link-a").href = "https://www.saccounty.net/Redistricting/Pages/default.aspx";
              document.getElementById("partnership-a").src = "/assets/partners-sacramento.png";
            }
        }

        // document.getElementById("eventCode").innerText = og_eventCode;
        if (eventDescriptions[eventCode]) {
            let desc = document.createElement("div");
            desc.innerHTML = eventDescriptions[eventCode];
            document.getElementById("event-description").prepend(desc);
        }
        if (longAbout[eventCode]) {
            document.getElementById("about-section").style.display = "block";
            document.getElementsByClassName("about-section")[0].style.display = "list-item";
            document.getElementById("about-section-text").innerHTML = longAbout[eventCode].map(p => '<p>' + p + '</p>').join("");
        }

        if (eventCode === "open-maps") {
          // ohio mini-map
          document.getElementById("mini-maps").style.display = "block";
          document.getElementById("districting-options").style.display = "none";
          document.getElementById("districting-options-title").style.display = "none";
          const scale = 3200;
          const translate = [-440, 240];
          const path = geoPath(
              geoAlbersUsaTerritories()
                  .scale(scale)
                  .translate(translate)
          ).pointRadius(9);
          fetch("/assets/oh-zone-map.geojson").then(res => res.json()).then(gj => {
            render(svg`<svg viewBox="0 0 300 300" style="width:300px; height:300px;">
              <g id="states-group" @mouseleave=${() => {}}>
                ${gj.features.filter(f => f.geometry.type !== "Point").map((feature, idx) => {
                    // console.log(feature);
                    return svg`<path id="x" stroke-width="0"
                        d="${path(feature)}"
                        @click=${(e) => {
                            document.querySelectorAll(".pcommunity")[0].click();
                        }}
                    ></path>`;
                })}
                </g>
              </svg>`, document.getElementById("mini-map-0"));

            render(svg`<svg viewBox="0 0 300 300" style="width:300px; height:300px;">
              <g id="states-group" @mouseleave=${() => {}}>
                ${gj.features.filter(f => f.geometry.type !== "Point").map((feature, idx) => {
                    // console.log(feature);
                    return svg`<path id="x" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
                        d="${path(feature)}"
                        @click=${(e) => {
                          document.querySelector(".pcommunity." + feature.properties.name).click();
                        }}></path>`;
                })}
                </g>
              </svg>`, document.getElementById("mini-map"));


              render(svg`<svg viewBox="0 0 300 300" style="width:300px; height:300px;">
                <g id="states-group" @mouseleave=${() => {}}>
                  ${gj.features.filter(f => f.geometry.type !== "Point").map((feature, idx) => {
                      // console.log(feature);
                      return svg`<path id="x" fill="#ccc" stroke-width="0"
                          d="${path(feature)}"
                      ></path>`;
                  })}
                  ${gj.features.filter(f => f.geometry.type === "Point").map((feature, idx) => {
                      return svg`<path class="circle"
                          d="${path(feature)}"
                          @mouseover=${() => {
                            document.getElementById("city-caption").innerText = feature.properties.name;
                          }}
                          @mouseout=${() => {
                            document.getElementById("city-caption").innerText = "";
                          }}
                          @click=${(e) => {
                            document.querySelectorAll(".pcommunity").forEach((block) => {
                                let city = block.innerText.trim().split("\n")[0].toLowerCase();
                                if (feature.properties.name.toLowerCase().includes(city)) {
                                    block.click();
                                }
                            });
                          }}></path>`;
                  })}
                  </g>
                </svg>`, document.getElementById("mini-map-2"));
          });
        }

        if (hybrid_events.includes(eventCode)) {
          document.getElementById("draw-goal").innerText = 'drawing';
        } else {
          document.getElementById("draw-goal").innerText = coi_events.includes(eventCode) ? "drawing your community" : "drawing districts";
        }

        const target = document.getElementById("districting-options");
        if (typeof validEventCodes[eventCode] === 'string') {
            validEventCodes[eventCode] = [validEventCodes[eventCode]];
        }
        if (!validEventCodes[eventCode].length) {
            document.getElementById("communities").style.display = "none";
            document.getElementsByClassName("draw-section")[0].style.display = "none";
            document.getElementsByTagName("p")[0].style.display = "none";
        }

        listPlacesForState(stateForEvent[eventCode], coi_events.includes(eventCode)).then(places => {
            validEventCodes[eventCode].forEach(placeID => {
                let place = places.find(p => p.id === placeID);
                if (coi_events.includes(eventCode) || coi_events.includes(placeID)) {
                    place.districtingProblems = [
                        { type: "community", numberOfParts: 250, pluralNoun: "Community" }
                    ];
                }
                if (unitTypes[eventCode]) {
                    if (unitTypes[eventCode].no) {
                        // block-list
                        place.units = place.units.filter(u => !unitTypes[eventCode].no.includes(u.name));
                    } else if (unitTypes[eventCode].yes) {
                        // allow-list
                        place.units = place.units.filter(u => unitTypes[eventCode].yes.includes(u.name));
                    }
                }
                const mydiv = document.createElement('li');
                target.append(mydiv);
                render(placeItems(place, startNewPlan, eventCode, portal_events.includes(eventCode)), mydiv);

                if (hybrid_events.includes(eventCode)) {
                    const mydiv2 = document.createElement('li');
                    target.append(mydiv2);
                    render(placeItems({
                      ...place,
                      districtingProblems: [
                          { type: "community", numberOfParts: 250, pluralNoun: "Community" }
                      ]
                    }, startNewPlan, eventCode, portal_events.includes(eventCode)), mydiv2);
                }
            });
        });

        let limitNum = 16;
        let eventurl = (window.location.hostname === "localhost")
                    ? "/assets/sample_event.json"
                    : (`/.netlify/functions/eventRead?limit=${limitNum + 1}&event=${eventCode}`);

        let showPlans = (data, unlimited) => {
            let loadExtraPlans = !unlimited && ((data.plans.length > limitNum) || (window.location.hostname.includes("localhost")));
            const plans = [{
                title: (eventCode === "missouri-mapping" ? "What community maps can look like" : "Community-submitted maps"),
                plans: data.plans.filter(p => !((blockPlans[eventCode] || []).includes(p.simple_id))).slice(0, unlimited ? 1000 : limitNum)
            }];
            render(html`
                ${plansSection(plans, eventCode)}
                ${loadExtraPlans ?
                  html`<button id="loadMorePlans" @click="${(e) => {
                      document.getElementById("event-pinwheel").style.display = "block";
                      document.getElementById("loadMorePlans").style.display = "none";
                      fetch(eventurl.replace(`limit=${limitNum + 1}`, "limit=1000")).then(res => res.json()).then(d => showPlans(d, true));
                  }}">Load All Plans</button>
                  ${unlimited ? "" : html`<img id="event-pinwheel" src="/assets/pinwheel2.gif" style="display:none"/>`}`
                : ""}
            `, document.getElementById("plans"));

            if (proposals_by_event[eventCode]) {
                fetch(`/assets/plans/${eventCode}.json`).then(res => res.json()).then(sample => {
                    render(plansSection([{ title: 'Sample plans', plans: sample.plans, desc: (sample.description ? sample.description : null) }], eventCode, true), document.getElementById("proposals"));
                });
            } else {
                document.getElementById("sample_plan_link").style.display = "none";
            }
        }

        fetch(eventurl).then(res => res.json()).then(showPlans);
    } else {
        const target = document.getElementById("districting-options");
        render("Tag or Organization not recognized", target);
    }
};

const plansSection = (plans, eventCode, isProfessionalSamples) =>
    plans.map(
        ({ title, plans, desc }) => html`
            <section id="${isProfessionalSamples ? "sample" : "shared"}" class="place__section">
                <h2>${title}</h2>
                ${(isProfessionalSamples || !proposals_by_event[eventCode])
                  ? html`<p>
                    ${(["saccounty", "saccountymap"].includes(eventCode) || !plans.length)
                      ? "As maps are submitted they will appear below, and you will be able to click on any of the maps to open it in Districtr."
                      : "Click on any of the maps below to open it in Districtr."}
                </p>` : null}
                ${desc ? html`<h4>${desc}</h4>` : ""}
                <ul class="plan-thumbs">
                    ${plans.map((p, i) => loadablePlan(p, eventCode, isProfessionalSamples))}
                </ul>
            </section>
        `
    );

const loadablePlan = (plan, eventCode, isProfessionalSamples) => {
    let completness = null,
        unitCount = plan.filledBlocks || Object.keys(plan.plan.assignment || {}).length,
        districtCount = (new Set(
            Object.values(plan.plan.assignment || {})
                  .map(z => (z && z.length) ? z[0] : z)
                  .filter(z => ![null, "null", undefined, "undefined", -1].includes(z))
        )).size,
        districtGoal = plan.plan.problem.numberOfParts,
        districtOff = !coi_events.includes(eventCode) && !hybrid_events.includes(eventCode) && (districtCount < districtGoal),
        unitOff = !coi_events.includes(eventCode) && !hybrid_events.includes(eventCode) && unitCounts[eventCode] && (unitCount < unitCounts[eventCode]);

    let screenshot = plan.screenshot2 || plan.screenshot;
    let urlcode = eventCode;
    if (portal_events.includes(eventCode)) {
      urlcode += '&portal';
    }

    return html`
    <a href="/edit/${plan.simple_id || plan._id}?event=${urlcode}">
        <li class="plan-thumbs__thumb">
            ${(screenshot && screenshot.length > 60 && screenshot.indexOf("data") === 0)
                ? html`<img
                    class="thumb__img"
                    src="${screenshot}"
                    alt="Districting Plan ${plan.simple_id}"
                />`
                : ''
            }
            <figcaption class="thumb__caption">
                <h6 class="thumb__heading">${plan.planName || ''}
                      <br/>
                      ID: ${plan.simple_id || plan._id}</h6>
                <br/>
                ${(plan.isScratch ? html`<h4 style="font-style: italic">Draft Plan</h4>` : "")}
                <span>
                  ${plan.plan.place.name || ""}
                  <br/>
                  ${(plan.plan.problem.type === "community")
                    ? "Communities of Interest"
                    : plan.plan.problem.pluralNoun
                  }
                  <br/>
                  from ${plan.plan.units.name}
                </span>
                <br/>
                ${isProfessionalSamples ? "" : html`<span>Updated<br/>
                      ${(new Date(plan.startDate)).toLocaleString()}</span>`}
            </figcaption>
            ${(coi_events.includes(eventCode) || isProfessionalSamples)
                ? null
                : html`
                  <span style="margin:10px">
                      ${coi_events.includes(eventCode) ? "" : (districtCount + "/" + districtGoal + " districts")}
                      ${unitOff ? html`<br/>` : null }
                      ${unitOff ? (Math.floor(100 * unitCount/unitCounts[eventCode]) + "% of units") : null}
                  </span>
                  <span style="margin:10px;margin-top:0;">
                    ${(districtOff || unitOff)
                        ? "Incomplete"
                        : "Complete"}
                  </span>`
            }
        </li>
    </a>`;
}
