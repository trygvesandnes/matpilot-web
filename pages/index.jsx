import { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";

// Storage-polyfill: bruker localStorage i browser
if (typeof window !== "undefined") {
  window.storage = {
    get: async (key) => {
      const val = localStorage.getItem(key);
      if (val === null) throw new Error("not found");
      return { key, value: val };
    },
    set: async (key, value) => {
      localStorage.setItem(key, String(value));
      return { key, value };
    },
    delete: async (key) => {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
    list: async (prefix) => {
      const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix));
      return { keys };
    },
  };
}


/* ════ DESIGN TOKENS ════ */
const C = {
  blue:"#2563EB", blueLys:"#EFF4FF", bg:"#F6F7F9", card:"#FFFFFF",
  text:"#16181D", sub:"#6B7280", border:"#E9EBEE",
  ok:"#16A34A", okLys:"#EAF7EE", warn:"#D97706", warnLys:"#FEF6E7", err:"#DC2626", errLys:"#FDECEC",
  tilbud:"#cfe8ff", tilbudKant:"#4ba3e8", tilbudTekst:"#1a72c4", gull:"#F5B301",
};
const sCard = { background:C.card, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 2px rgba(16,24,40,0.04)" };
const sKnapp = { background:C.blue, color:"#fff", border:"none", borderRadius:12, padding:"13px 16px", fontSize:15, fontWeight:700, cursor:"pointer", width:"100%" };
const sKnappSek = { background:"#fff", color:C.text, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", fontSize:14, fontWeight:600, cursor:"pointer", width:"100%" };
const sChip = (a)=>({ background:a?C.blue:"#fff", color:a?"#fff":C.sub, border:a?"none":`1px solid ${C.border}`, borderRadius:18, padding:"7px 14px", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" });
const sInput = { width:"100%", boxSizing:"border-box", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", fontSize:15, background:"#fff", outline:"none" };
const lnk = { background:"none", border:"none", color:C.blue, fontSize:13, fontWeight:600, cursor:"pointer", padding:0 };

/* ════ KJEDER & BUTIKKER ════ */
const KJEDER = {
  // NorgesGruppen
  KIWI:        {navn:"Kiwi",          farge:"#00833e", gruppe:"NorgesGruppen"},
  MENY:        {navn:"Meny",          farge:"#004b8d", gruppe:"NorgesGruppen"},
  SPAR:        {navn:"Spar",          farge:"#007a3d", gruppe:"NorgesGruppen"},
  EUROSPAR:    {navn:"Eurospar",      farge:"#007a3d", gruppe:"NorgesGruppen"},
  JOKER:       {navn:"Joker",         farge:"#e30613", gruppe:"NorgesGruppen"},
  NAERBUTIKKEN:{navn:"Nærbutikken",   farge:"#e30613", gruppe:"NorgesGruppen"},
  // Coop
  COOP_EXTRA:  {navn:"Coop Extra",    farge:"#0057a8", gruppe:"Coop"},
  COOP_OBS:    {navn:"Coop Obs",      farge:"#0066b3", gruppe:"Coop"},
  COOP_PRIX:   {navn:"Coop Prix",     farge:"#0057a8", gruppe:"Coop"},
  COOP_MEGA:   {navn:"Coop Mega",     farge:"#0066b3", gruppe:"Coop"},
  COOP_MARKED: {navn:"Coop Marked",   farge:"#0057a8", gruppe:"Coop"},
  MATKROKEN:   {navn:"Matkroken",     farge:"#e05a00", gruppe:"Coop"},
  // Rema
  REMA_1000:   {navn:"Rema 1000",     farge:"#cc0000", gruppe:"Rema"},
  // Andre
  BUNNPRIS:    {navn:"Bunnpris",      farge:"#e06c00", gruppe:"Bunnpris"},
  EUROPRIS:    {navn:"Europris",      farge:"#f7a800", gruppe:"Europris"},
  FUDI:        {navn:"FUDI",          farge:"#e63946", gruppe:"FUDI"},
  HAVARISTEN:  {navn:"Havaristen",    farge:"#1d3557", gruppe:"Havaristen"},
  GIGABOKS:    {navn:"Gigaboks",      farge:"#2d6a4f", gruppe:"NorgesGruppen"},
  ODA:         {navn:"Oda",           farge:"#6a0dad", gruppe:"Nettbutikk"},
};
const SEED_BUTIKKER = [
  // ── OSLO ────────────────────────────────────────────────────────────────
  {id:"kiwi_gronland",    navn:"Kiwi Grønland",          kjede:"KIWI",         adresse:"Tøyengata 2",              sted:"Oslo"},
  {id:"kiwi_majorstuen",  navn:"Kiwi Majorstuen",        kjede:"KIWI",         adresse:"Bogstadveien 60",          sted:"Oslo"},
  {id:"kiwi_grunerlokka", navn:"Kiwi Grünerløkka",       kjede:"KIWI",         adresse:"Thorvald Meyers gate 56",  sted:"Oslo"},
  {id:"kiwi_romsas",      navn:"Kiwi Romsås",            kjede:"KIWI",         adresse:"Romsås senter",            sted:"Oslo"},
  {id:"kiwi_lambertseter",navn:"Kiwi Lambertseter",      kjede:"KIWI",         adresse:"Lambertseter senter",      sted:"Oslo"},
  {id:"rema_solli",       navn:"Rema 1000 Solli plass",  kjede:"REMA_1000",    adresse:"Drammensveien 1",          sted:"Oslo"},
  {id:"rema_tveita",      navn:"Rema 1000 Tveita",       kjede:"REMA_1000",    adresse:"Tveita senter",            sted:"Oslo"},
  {id:"rema_storo",       navn:"Rema 1000 Storo",        kjede:"REMA_1000",    adresse:"Vitaminveien 7",           sted:"Oslo"},
  {id:"rema_ulleval",     navn:"Rema 1000 Ullevål",      kjede:"REMA_1000",    adresse:"Ullevålsveien 78",         sted:"Oslo"},
  {id:"rema_frogner",     navn:"Rema 1000 Frogner",      kjede:"REMA_1000",    adresse:"Bygdøy allé 34",           sted:"Oslo"},
  {id:"meny_aker_brygge", navn:"Meny Aker Brygge",       kjede:"MENY",         adresse:"Stranden 3",               sted:"Oslo"},
  {id:"meny_steen_strom", navn:"Meny Steen & Strøm",     kjede:"MENY",         adresse:"Nedre Slottsgate 8",       sted:"Oslo"},
  {id:"meny_manglerud",   navn:"Meny Manglerud",         kjede:"MENY",         adresse:"Plogveien 1",              sted:"Oslo"},
  {id:"meny_storo",       navn:"Meny Storo",             kjede:"MENY",         adresse:"Vitaminveien 7",           sted:"Oslo"},
  {id:"spar_frogner",     navn:"Spar Frogner",           kjede:"SPAR",         adresse:"Vibes gate 13",            sted:"Oslo"},
  {id:"spar_toyen",       navn:"Spar Tøyen",             kjede:"SPAR",         adresse:"Tøyengata 20",             sted:"Oslo"},
  {id:"eurospar_ekeberg", navn:"Eurospar Ekeberg",       kjede:"EUROSPAR",     adresse:"Ekebergveien 144",         sted:"Oslo"},
  {id:"joker_st_hanshaugen",navn:"Joker St. Hanshaugen", kjede:"JOKER",        adresse:"Pilestredet 50",           sted:"Oslo"},
  {id:"joker_bjolsen",    navn:"Joker Bjølsen",          kjede:"JOKER",        adresse:"Sandakerveien 24",         sted:"Oslo"},
  {id:"extra_mortensrud",  navn:"Coop Extra Mortensrud", kjede:"COOP_EXTRA",   adresse:"Mortensrud senter",        sted:"Oslo"},
  {id:"extra_loerenskog",  navn:"Coop Extra Lørenskog",  kjede:"COOP_EXTRA",   adresse:"Lørenskog storsenter",     sted:"Oslo"},
  {id:"obs_furuset",       navn:"Coop Obs Furuset",      kjede:"COOP_OBS",     adresse:"Furuset senter",           sted:"Oslo"},
  {id:"obs_ski",           navn:"Coop Obs Ski",          kjede:"COOP_OBS",     adresse:"Ski storsenter",           sted:"Ski"},
  {id:"prix_oslo_s",       navn:"Coop Prix Oslo S",      kjede:"COOP_PRIX",    adresse:"Oslo sentralstasjon",      sted:"Oslo"},
  {id:"bunnpris_gronland", navn:"Bunnpris Grønland",     kjede:"BUNNPRIS",     adresse:"Grønlandsleiret 25",       sted:"Oslo"},
  {id:"europris_oslo_city",navn:"Europris Oslo City",    kjede:"EUROPRIS",     adresse:"Stenersgata 1",            sted:"Oslo"},
  {id:"fudi_oslo",         navn:"FUDI Mortensrud",       kjede:"FUDI",         adresse:"Mortensrud senter",        sted:"Oslo"},

  // ── BERGEN ──────────────────────────────────────────────────────────────
  {id:"kiwi_bergen_sentrum",  navn:"Kiwi Bergen sentrum",  kjede:"KIWI",      adresse:"Strandgaten 10",           sted:"Bergen"},
  {id:"kiwi_danmarksplass",   navn:"Kiwi Danmarksplass",   kjede:"KIWI",      adresse:"Danmarksplass 2",          sted:"Bergen"},
  {id:"kiwi_lagunen",         navn:"Kiwi Lagunen",         kjede:"KIWI",      adresse:"Laguneparken 2",           sted:"Bergen"},
  {id:"rema_bergen_sentrum",  navn:"Rema 1000 Bergen sentrum",kjede:"REMA_1000",adresse:"Neumannsgate 2",         sted:"Bergen"},
  {id:"rema_loddefjord",      navn:"Rema 1000 Loddefjord", kjede:"REMA_1000", adresse:"Loddefjord senter",        sted:"Bergen"},
  {id:"rema_aastvedt",        navn:"Rema 1000 Åsane",      kjede:"REMA_1000", adresse:"Åsane senter",             sted:"Bergen"},
  {id:"meny_lagunen",         navn:"Meny Lagunen",         kjede:"MENY",      adresse:"Laguneparken 2",           sted:"Bergen"},
  {id:"meny_xhibition",       navn:"Meny Xhibition",       kjede:"MENY",      adresse:"Småstrandgaten 3",         sted:"Bergen"},
  {id:"spar_fyllingsdalen",   navn:"Spar Fyllingsdalen",   kjede:"SPAR",      adresse:"Fyllingsdalen senter",     sted:"Bergen"},
  {id:"eurospar_oasen",       navn:"Eurospar Oasen",       kjede:"EUROSPAR",  adresse:"Folke Bernadottes vei 41", sted:"Bergen"},
  {id:"joker_nordnes",        navn:"Joker Nordnes",        kjede:"JOKER",     adresse:"Nordnesbakken 1",          sted:"Bergen"},
  {id:"extra_aaane_storsenter",navn:"Coop Extra Åsane",    kjede:"COOP_EXTRA",adresse:"Åsane senter",             sted:"Bergen"},
  {id:"obs_horisont",         navn:"Coop Obs Horisont",    kjede:"COOP_OBS",  adresse:"Folke Bernadottes vei 41", sted:"Bergen"},
  {id:"bunnpris_bergen",      navn:"Bunnpris Møhlenpris",  kjede:"BUNNPRIS",  adresse:"Møhlenprisen 14",          sted:"Bergen"},
  {id:"europris_vestkanten",  navn:"Europris Vestkanten",  kjede:"EUROPRIS",  adresse:"Vestkanten kjøpesenter",   sted:"Bergen"},

  // ── TRONDHEIM ───────────────────────────────────────────────────────────
  {id:"rema_lade",            navn:"Rema 1000 Lade",             kjede:"REMA_1000",  adresse:"Haakon VIIs gate 9",       sted:"Trondheim"},
  {id:"rema_moholt",          navn:"Rema 1000 Moholt",           kjede:"REMA_1000",  adresse:"Brøsetvegen 145",          sted:"Trondheim"},
  {id:"rema_sirkus",          navn:"Rema 1000 Sirkus",           kjede:"REMA_1000",  adresse:"Falkenborgvegen 1",        sted:"Trondheim"},
  {id:"rema_saupstad",        navn:"Rema 1000 Saupstad",         kjede:"REMA_1000",  adresse:"Saupstad senter",          sted:"Trondheim"},
  {id:"kiwi_moholt",          navn:"Kiwi Moholt",                kjede:"KIWI",       adresse:"Jonsvannsveien 82",        sted:"Trondheim"},
  {id:"kiwi_solsiden",        navn:"Kiwi Solsiden",              kjede:"KIWI",       adresse:"Beddingen 10",             sted:"Trondheim"},
  {id:"kiwi_byasen",          navn:"Kiwi Byåsen",                kjede:"KIWI",       adresse:"Byåsveien 158",            sted:"Trondheim"},
  {id:"kiwi_nardo",           navn:"Kiwi Nardo",                 kjede:"KIWI",       adresse:"Nardoveien 2",             sted:"Trondheim"},
  {id:"extra_sirkus",         navn:"Coop Extra Sirkus Shopping", kjede:"COOP_EXTRA", adresse:"Falkenborgvegen 1",        sted:"Trondheim"},
  {id:"extra_ila",            navn:"Coop Extra Ila",             kjede:"COOP_EXTRA", adresse:"Mellomila 90",             sted:"Trondheim"},
  {id:"obs_lade",             navn:"Coop Obs City Lade",         kjede:"COOP_OBS",   adresse:"Haakon VIIs gate 23",      sted:"Trondheim"},
  {id:"prix_ila",             navn:"Coop Prix Ila",              kjede:"COOP_PRIX",  adresse:"Ilevollen 19",             sted:"Trondheim"},
  {id:"mega_valentinlyst",    navn:"Coop Mega Valentinlyst",     kjede:"COOP_MEGA",  adresse:"Valentinlystsenteret",     sted:"Trondheim"},
  {id:"bunnpris_munke",       navn:"Bunnpris Munkegata",         kjede:"BUNNPRIS",   adresse:"Munkegata 58",             sted:"Trondheim"},
  {id:"meny_solsiden",        navn:"Meny Solsiden",              kjede:"MENY",       adresse:"Beddingen 4",              sted:"Trondheim"},
  {id:"spar_byasen",          navn:"Spar Byåsen",                kjede:"SPAR",       adresse:"Selsbakkvegen 34",         sted:"Trondheim"},
  {id:"joker_bakklandet",     navn:"Joker Bakklandet",           kjede:"JOKER",      adresse:"Nedre Bakklandet 60",      sted:"Trondheim"},
  {id:"eurospar_trondheim",   navn:"Eurospar Heimdal",           kjede:"EUROSPAR",   adresse:"Heimdal senter",           sted:"Trondheim"},
  {id:"naerbutikken_tyholt",  navn:"Nærbutikken Tyholt",         kjede:"NAERBUTIKKEN",adresse:"Tyholttorget 3",          sted:"Trondheim"},
  // Trondheim – nye
  {id:"kiwi_munkegata",      navn:"Kiwi Munkegata",             kjede:"KIWI",        adresse:"Olav Tryggvasons gt. 41", sted:"Trondheim"},
  {id:"kiwi_havstad",        navn:"Kiwi Havstad",               kjede:"KIWI",        adresse:"Byåsveien 168",           sted:"Trondheim"},
  {id:"kiwi_dalgard",        navn:"Kiwi Dalgård",               kjede:"KIWI",        adresse:"Drivhusvegen 2",          sted:"Trondheim"},
  {id:"kiwi_nardobakken",    navn:"Kiwi Nardobakken",           kjede:"KIWI",        adresse:"Nardobakken 2",           sted:"Trondheim"},
  {id:"kiwi_sorgenfri",      navn:"Kiwi Sorgenfri",             kjede:"KIWI",        adresse:"Sorgenfriveien 28",       sted:"Trondheim"},
  {id:"kiwi_strinda",        navn:"Kiwi Strinda",               kjede:"KIWI",        adresse:"Ingvald Ystgaards veg 38",sted:"Trondheim"},
  {id:"rema_torvet",         navn:"Rema 1000 Torvet",           kjede:"REMA_1000",   adresse:"Munkegata 22",            sted:"Trondheim"},
  {id:"rema_elgeseter",      navn:"Rema 1000 Elgeseter",        kjede:"REMA_1000",   adresse:"Klæbuveien 68",           sted:"Trondheim"},
  {id:"rema_prinsens",       navn:"Rema 1000 Prinsensgate",     kjede:"REMA_1000",   adresse:"Prinsens gt. 49",         sted:"Trondheim"},
  {id:"rema_olav",           navn:"Rema 1000 Olav Tryggvasons", kjede:"REMA_1000",   adresse:"Olav Tryggvasons gt. 15", sted:"Trondheim"},
  {id:"rema_ladetorget",     navn:"Rema 1000 Ladetorget",       kjede:"REMA_1000",   adresse:"Østmarkveien 2",          sted:"Trondheim"},
  {id:"rema_solsiden",       navn:"Rema 1000 Solsiden",         kjede:"REMA_1000",   adresse:"Dyre Halses gate 1A",     sted:"Trondheim"},
  {id:"rema_pirsenteret",    navn:"Rema 1000 Pirsenteret",      kjede:"REMA_1000",   adresse:"Havnegata 7",             sted:"Trondheim"},
  {id:"rema_havstein",       navn:"Rema 1000 Havstein",         kjede:"REMA_1000",   adresse:"John Skaarvolds veg 40",  sted:"Trondheim"},
  {id:"rema_stavset",        navn:"Rema 1000 Stavset",          kjede:"REMA_1000",   adresse:"Enromvegen 2",            sted:"Trondheim"},
  {id:"rema_nidarvoll",      navn:"Rema 1000 Nidarvoll",        kjede:"REMA_1000",   adresse:"Sluppenvegen 2",          sted:"Trondheim"},
  {id:"bunnpris_leuthen",    navn:"Bunnpris Leüthen",           kjede:"BUNNPRIS",    adresse:"Kongens gate 56",         sted:"Trondheim"},
  // Lade
  {id:"kiwi_lilleby",        navn:"Kiwi Lilleby",               kjede:"KIWI",        adresse:"Lilleby",                 sted:"Trondheim"},
  {id:"extra_lilleby",       navn:"Coop Extra Lilleby",         kjede:"COOP_EXTRA",  adresse:"Lilleby",                 sted:"Trondheim"},
  // Andre Trondheim
  {id:"rema_bromstad",       navn:"Rema 1000 Bromstad",         kjede:"REMA_1000",   adresse:"Kong Øysteins veg 7",     sted:"Trondheim"},
  {id:"extra_grillstad",     navn:"Coop Extra Grillstad",       kjede:"COOP_EXTRA",  adresse:"Skonnertvegen 8, Ranheim",sted:"Trondheim"},
  {id:"bunnpris_moholt",     navn:"Bunnpris Moholt",            kjede:"BUNNPRIS",    adresse:"Bregneveien 67",          sted:"Trondheim"},
  {id:"bunnpris_angell",     navn:"Bunnpris Angelltrøa",        kjede:"BUNNPRIS",    adresse:"Jakobsliveien 7",         sted:"Trondheim"},
  {id:"extra_elgeseter",     navn:"Coop Extra Elgeseter",       kjede:"COOP_EXTRA",  adresse:"Klæbuveien",              sted:"Trondheim"},

  // Brønnøysund – alle butikker
  {id:"rema_bronnoysund",    navn:"Rema 1000 Brønnøysund",     kjede:"REMA_1000",   adresse:"Sømnaveien 139",           sted:"Brønnøysund"},
  {id:"kiwi_bronnoysund",    navn:"Kiwi Brønnøysund",          kjede:"KIWI",        adresse:"Sømnaveien 106",           sted:"Brønnøysund"},
  {id:"bunnpris_bronnoysund",navn:"Bunnpris Brønnøysund",      kjede:"BUNNPRIS",    adresse:"Storgata 30",              sted:"Brønnøysund"},
  {id:"extra_bronnoysund",   navn:"Coop Extra Brønnøysund",    kjede:"COOP_EXTRA",  adresse:"Storgata 58",              sted:"Brønnøysund"},
  {id:"extra_salhus",        navn:"Coop Extra Salhus",         kjede:"COOP_EXTRA",  adresse:"Sømnaveien 161",           sted:"Brønnøysund"},
  {id:"eurospar_bronnoysund",navn:"Eurospar Brønnøysund",      kjede:"EUROSPAR",    adresse:"Salhusmarka 2",            sted:"Brønnøysund"},
  {id:"prix_farmen",         navn:"Coop Prix Farmen",          kjede:"COOP_PRIX",   adresse:"Farmenveien 40",           sted:"Brønnøysund"},

  // ── STAVANGER / ROGALAND ─────────────────────────────────────────────────
  {id:"kiwi_stavanger_sentrum",navn:"Kiwi Stavanger sentrum",  kjede:"KIWI",      adresse:"Klubbgata 4",              sted:"Stavanger"},
  {id:"kiwi_kvadrat",          navn:"Kiwi Kvadrat",            kjede:"KIWI",      adresse:"Kvadrat kjøpesenter",      sted:"Sandnes"},
  {id:"kiwi_madla",            navn:"Kiwi Madla",              kjede:"KIWI",      adresse:"Madlaveien 60",            sted:"Stavanger"},
  {id:"rema_stavanger_hinna",  navn:"Rema 1000 Hinna",         kjede:"REMA_1000", adresse:"Jåttåvågveien 7",          sted:"Stavanger"},
  {id:"rema_stavanger_storhaug",navn:"Rema 1000 Storhaug",     kjede:"REMA_1000", adresse:"Pedersgata 58",            sted:"Stavanger"},
  {id:"meny_stavanger",        navn:"Meny Stavanger storsenter",kjede:"MENY",     adresse:"Lagårdsveien 75",          sted:"Stavanger"},
  {id:"extra_stavanger",       navn:"Coop Extra Stavanger",    kjede:"COOP_EXTRA",adresse:"Kannik 2",                 sted:"Stavanger"},
  {id:"obs_forus",             navn:"Coop Obs Forus",          kjede:"COOP_OBS",  adresse:"Forusbeen 35",             sted:"Stavanger"},
  {id:"spar_sandnes",          navn:"Spar Sandnes",            kjede:"SPAR",      adresse:"Rådhusgata 5",             sted:"Sandnes"},
  {id:"eurospar_stavanger",    navn:"Eurospar Stavanger",      kjede:"EUROSPAR",  adresse:"Bekkefaret 25",            sted:"Stavanger"},
  {id:"bunnpris_stavanger",    navn:"Bunnpris Stavanger",      kjede:"BUNNPRIS",  adresse:"Bergelandsgata 6",         sted:"Stavanger"},
  {id:"europris_stavanger",    navn:"Europris Stavanger",      kjede:"EUROPRIS",  adresse:"Hillevågsveien 27",        sted:"Stavanger"},

  // ── KRISTIANSAND ─────────────────────────────────────────────────────────
  {id:"kiwi_kristiansand",    navn:"Kiwi Kristiansand sentrum",kjede:"KIWI",      adresse:"Markens gate 5",           sted:"Kristiansand"},
  {id:"rema_kristiansand",    navn:"Rema 1000 Lund",          kjede:"REMA_1000", adresse:"Lundsbroa 2",              sted:"Kristiansand"},
  {id:"meny_kristiansand",    navn:"Meny Sørlandssenteret",   kjede:"MENY",      adresse:"Barstølveien 34",          sted:"Kristiansand"},
  {id:"obs_kristiansand",     navn:"Coop Obs Kristiansand",   kjede:"COOP_OBS",  adresse:"Barstølveien 34",          sted:"Kristiansand"},
  {id:"spar_kristiansand",    navn:"Spar Kristiansand",       kjede:"SPAR",      adresse:"Kongensgate 12",           sted:"Kristiansand"},
  {id:"joker_kristiansand",   navn:"Joker Kvadraturen",       kjede:"JOKER",     adresse:"Dronningensgate 19",       sted:"Kristiansand"},
  {id:"bunnpris_kristiansand",navn:"Bunnpris Lund",           kjede:"BUNNPRIS",  adresse:"Lundsbroa 8",              sted:"Kristiansand"},

  // ── TROMSØ ───────────────────────────────────────────────────────────────
  {id:"kiwi_tromso_sentrum",  navn:"Kiwi Tromsø sentrum",     kjede:"KIWI",      adresse:"Storgata 60",              sted:"Tromsø"},
  {id:"kiwi_langnes",         navn:"Kiwi Langnes",            kjede:"KIWI",      adresse:"Langnes storsenter",       sted:"Tromsø"},
  {id:"rema_tromso",          navn:"Rema 1000 Tromsø",        kjede:"REMA_1000", adresse:"Stakkevollvegen 20",       sted:"Tromsø"},
  {id:"rema_nerstranda",      navn:"Rema 1000 Nerstranda",    kjede:"REMA_1000", adresse:"Nerstranda kjøpesenter",   sted:"Tromsø"},
  {id:"meny_tromso",          navn:"Meny Pyramiden",          kjede:"MENY",      adresse:"Pyramiden kjøpesenter",    sted:"Tromsø"},
  {id:"eurospar_kraemer",     navn:"Eurospar Kræmer",         kjede:"EUROSPAR",  adresse:"Stakkevollvegen 41",       sted:"Tromsø"},
  {id:"eurospar_tomasjord",   navn:"Eurospar Tomasjord",      kjede:"EUROSPAR",  adresse:"Tomasjordveien 30",        sted:"Tromsø"},
  {id:"extra_tromso",         navn:"Coop Extra Langnes",      kjede:"COOP_EXTRA",adresse:"Langnes storsenter",       sted:"Tromsø"},
  {id:"joker_tromso",         navn:"Joker Kroken",            kjede:"JOKER",     adresse:"Kroken senter",            sted:"Tromsø"},
  {id:"naerbutikken_tromso",  navn:"Nærbutikken Kvaløya",     kjede:"NAERBUTIKKEN",adresse:"Kvaløysletta 101",       sted:"Tromsø"},

  // ── DRAMMEN / VESTFOLD ────────────────────────────────────────────────────
  {id:"kiwi_drammen",        navn:"Kiwi Drammen sentrum",     kjede:"KIWI",      adresse:"Bragernes torg 6",         sted:"Drammen"},
  {id:"rema_drammen",        navn:"Rema 1000 Drammen",        kjede:"REMA_1000", adresse:"Nedre Storgate 10",        sted:"Drammen"},
  {id:"meny_gulskogen",      navn:"Meny Gulskogen senter",    kjede:"MENY",      adresse:"Gulskogveien 25",          sted:"Drammen"},
  {id:"obs_torvbyen",        navn:"Coop Obs Torvbyen",        kjede:"COOP_OBS",  adresse:"Torvbyen kjøpesenter",     sted:"Fredrikstad"},
  {id:"kiwi_tonsberg",       navn:"Kiwi Tønsberg",            kjede:"KIWI",      adresse:"Nedre Langgate 22",        sted:"Tønsberg"},
  {id:"rema_tonsberg",       navn:"Rema 1000 Tønsberg",       kjede:"REMA_1000", adresse:"Farmannsveien 30",         sted:"Tønsberg"},
  {id:"meny_farmandstredet", navn:"Meny Farmandstredet",      kjede:"MENY",      adresse:"Farmandstredet 12",        sted:"Tønsberg"},
  {id:"eurospar_sandefjord", navn:"Eurospar Sandefjord",      kjede:"EUROSPAR",  adresse:"Jernbanealléen 16",        sted:"Sandefjord"},

  // ── FREDRIKSTAD / ØSTFOLD ─────────────────────────────────────────────────
  {id:"kiwi_fredrikstad",    navn:"Kiwi Fredrikstad",         kjede:"KIWI",      adresse:"Storgata 35",              sted:"Fredrikstad"},
  {id:"rema_fredrikstad",    navn:"Rema 1000 Fredrikstad",    kjede:"REMA_1000", adresse:"Nygaardsgate 10",          sted:"Fredrikstad"},
  {id:"meny_rolvsoy",        navn:"Meny Rolvsøy",             kjede:"MENY",      adresse:"Råbekken senter",          sted:"Fredrikstad"},
  {id:"kiwi_sarpsborg",      navn:"Kiwi Sarpsborg",           kjede:"KIWI",      adresse:"St. Mariegate 52",         sted:"Sarpsborg"},
  {id:"rema_sarpsborg",      navn:"Rema 1000 Sarpsborg",      kjede:"REMA_1000", adresse:"Glengsgata 7",             sted:"Sarpsborg"},

  // ── BODØ / NORDLAND ───────────────────────────────────────────────────────
  {id:"kiwi_bodo",           navn:"Kiwi Bodø sentrum",        kjede:"KIWI",      adresse:"Glasshuset senter",        sted:"Bodø"},
  {id:"rema_bodo",           navn:"Rema 1000 Bodø",           kjede:"REMA_1000", adresse:"Sjøgata 10",               sted:"Bodø"},
  {id:"meny_bodo",           navn:"Meny City Nord",           kjede:"MENY",      adresse:"Grønnegata 80",            sted:"Bodø"},
  {id:"extra_bodo",          navn:"Coop Extra Rønvik",        kjede:"COOP_EXTRA",adresse:"Rønvikveien 60",           sted:"Bodø"},
  {id:"eurospar_bodo",       navn:"Eurospar Bodø",            kjede:"EUROSPAR",  adresse:"Storgata 38",              sted:"Bodø"},
  {id:"joker_bodo",          navn:"Joker Bodø",               kjede:"JOKER",     adresse:"Bankgata 12",              sted:"Bodø"},
  {id:"matkroken_bodø",      navn:"Matkroken Bodø",           kjede:"MATKROKEN", adresse:"Tverlandet",               sted:"Bodø"},

  // ── ÅLESUND / MØRE OG ROMSDAL ─────────────────────────────────────────────
  {id:"kiwi_alesund",        navn:"Kiwi Ålesund sentrum",     kjede:"KIWI",      adresse:"Kongensgate 8",            sted:"Ålesund"},
  {id:"rema_alesund",        navn:"Rema 1000 Ålesund",        kjede:"REMA_1000", adresse:"Vegsundgata 16",           sted:"Ålesund"},
  {id:"meny_sunnmorssenteret",navn:"Meny Sunnmørssenteret",   kjede:"MENY",      adresse:"Sunnmørssenteret",         sted:"Ålesund"},
  {id:"eurospar_valderoy",   navn:"Eurospar Valderøy",        kjede:"EUROSPAR",  adresse:"Søre Skaret",              sted:"Valderøya"},
  {id:"extra_alesund",       navn:"Coop Extra Ålesund",       kjede:"COOP_EXTRA",adresse:"Moa senter",               sted:"Ålesund"},
  {id:"spar_molde",          navn:"Spar Molde",               kjede:"SPAR",      adresse:"Torget 5",                 sted:"Molde"},
  {id:"rema_molde",          navn:"Rema 1000 Molde",          kjede:"REMA_1000", adresse:"Røbekkvegen 1",            sted:"Molde"},
  {id:"naerbutikken_alesund",navn:"Nærbutikken Sjøholt",      kjede:"NAERBUTIKKEN",adresse:"Sjøholt sentrum",        sted:"Sjøholt"},

  // ── TROMS / FINNMARK ─────────────────────────────────────────────────────
  {id:"joker_alta",          navn:"Joker Alta",               kjede:"JOKER",     adresse:"Markedsveien 5",           sted:"Alta"},
  {id:"rema_alta",           navn:"Rema 1000 Alta",           kjede:"REMA_1000", adresse:"Bossekopveien 22",         sted:"Alta"},
  {id:"kiwi_hammerfest",     navn:"Kiwi Hammerfest",          kjede:"KIWI",      adresse:"Storgata 14",              sted:"Hammerfest"},
  {id:"matkroken_tana",      navn:"Matkroken Tana",           kjede:"MATKROKEN", adresse:"Tanabru",                  sted:"Tana"},
  {id:"joker_vardo",         navn:"Joker Vardø",              kjede:"JOKER",     adresse:"Storgata 23",              sted:"Vardø"},
  {id:"naerbutikken_kautokeino",navn:"Nærbutikken Kautokeino",kjede:"NAERBUTIKKEN",adresse:"Bredbuktnesveien 2",     sted:"Kautokeino"},

  // ── VESTLAND / Sogn OG FJORDANE ──────────────────────────────────────────
  {id:"kiwi_forde",          navn:"Kiwi Førde",               kjede:"KIWI",      adresse:"Hafstadveien 4",           sted:"Førde"},
  {id:"rema_forde",          navn:"Rema 1000 Førde",          kjede:"REMA_1000", adresse:"Angedalsvegen 19",         sted:"Førde"},
  {id:"spar_loen",           navn:"Spar Loen",                kjede:"SPAR",      adresse:"Loen 110",                 sted:"Loen"},
  {id:"matkroken_flam",      navn:"Matkroken Flåm",           kjede:"MATKROKEN", adresse:"Flåm sentrum",             sted:"Flåm"},
  {id:"joker_balestrand",    navn:"Joker Balestrand",         kjede:"JOKER",     adresse:"Holmen 1",                 sted:"Balestrand"},
  {id:"naerbutikken_laerdal",navn:"Nærbutikken Lærdal",       kjede:"NAERBUTIKKEN",adresse:"Lærdal sentrum",         sted:"Lærdal"},
  {id:"eurospar_sogndal",    navn:"Eurospar Sogndal",         kjede:"EUROSPAR",  adresse:"Gravensteinsgata 4",       sted:"Sogndal"},

  // ── INNLANDET ─────────────────────────────────────────────────────────────
  {id:"kiwi_lillehammer",    navn:"Kiwi Lillehammer",         kjede:"KIWI",      adresse:"Storgata 70",              sted:"Lillehammer"},
  {id:"rema_lillehammer",    navn:"Rema 1000 Lillehammer",    kjede:"REMA_1000", adresse:"Mesnagaté 14",             sted:"Lillehammer"},
  {id:"meny_lillehammer",    navn:"Meny Lillehammer",         kjede:"MENY",      adresse:"Strandtorget kjøpesenter", sted:"Lillehammer"},
  {id:"kiwi_hamar",          navn:"Kiwi Hamar",               kjede:"KIWI",      adresse:"Torggata 85",              sted:"Hamar"},
  {id:"rema_hamar",          navn:"Rema 1000 Hamar",          kjede:"REMA_1000", adresse:"Vangsvegen 73",            sted:"Hamar"},
  {id:"extra_hamar",         navn:"Coop Extra Hamar",         kjede:"COOP_EXTRA",adresse:"Ankerløkka senter",        sted:"Hamar"},
  {id:"spar_gjøvik",         navn:"Spar Gjøvik",              kjede:"SPAR",      adresse:"Storgata 12",              sted:"Gjøvik"},
  {id:"matkroken_roros",     navn:"Matkroken Røros",          kjede:"MATKROKEN", adresse:"Bergmannsgata 20",         sted:"Røros"},

  // ── TELEMARK / NUMEDAL ────────────────────────────────────────────────────
  {id:"kiwi_skien",          navn:"Kiwi Skien",               kjede:"KIWI",      adresse:"Kongensgate 6",            sted:"Skien"},
  {id:"rema_skien",          navn:"Rema 1000 Skien",          kjede:"REMA_1000", adresse:"Porsgrunnsvegen 6",        sted:"Skien"},
  {id:"meny_skien",          navn:"Meny Skien",               kjede:"MENY",      adresse:"Skien storsenter",         sted:"Skien"},
  {id:"kiwi_notodden",       navn:"Kiwi Notodden",            kjede:"KIWI",      adresse:"Heddalsveien 15",          sted:"Notodden"},
  {id:"joker_kviteseid",     navn:"Joker Kviteseid",          kjede:"JOKER",     adresse:"Kviteseid sentrum",        sted:"Kviteseid"},

  // ── AGDER ────────────────────────────────────────────────────────────────
  {id:"kiwi_arendal",        navn:"Kiwi Arendal",             kjede:"KIWI",      adresse:"Tyholmen 2",               sted:"Arendal"},
  {id:"rema_arendal",        navn:"Rema 1000 Arendal",        kjede:"REMA_1000", adresse:"Langbrygga 6",             sted:"Arendal"},
  {id:"meny_sorrlandsparken",navn:"Meny Sørlandsparken",      kjede:"MENY",      adresse:"Sørlandsparken kjøpesenter",sted:"Kristiansand"},
  {id:"kiwi_farsund",        navn:"Kiwi Farsund",             kjede:"KIWI",      adresse:"Torvet 2",                 sted:"Farsund"},
  {id:"spar_mandal",         navn:"Spar Mandal",              kjede:"SPAR",      adresse:"Store Elvegate 31",        sted:"Mandal"},
  {id:"naerbutikken_evje",   navn:"Nærbutikken Evje",         kjede:"NAERBUTIKKEN",adresse:"Evje sentrum",           sted:"Evje"},

  // ── GIGABOKS / HAVARISTEN / ANDRE ─────────────────────────────────────────
  {id:"gigaboks_oslo",       navn:"Gigaboks Oslo Sinsen",     kjede:"GIGABOKS",  adresse:"Sinsenkrysset 5",          sted:"Oslo"},
  {id:"gigaboks_bergen",     navn:"Gigaboks Bergen",          kjede:"GIGABOKS",  adresse:"Lagunen storsenter",       sted:"Bergen"},
  {id:"havaristen_oslo",     navn:"Havaristen Torshov",       kjede:"HAVARISTEN",adresse:"Vogts gate 72",            sted:"Oslo"},
  {id:"havaristen_bergen",   navn:"Havaristen Bergen",        kjede:"HAVARISTEN",adresse:"Ibsensgate 16",            sted:"Bergen"},
  {id:"marked_oslo",         navn:"Coop Marked Vinderen",     kjede:"COOP_MARKED",adresse:"Slemdalsveien 67",        sted:"Oslo"},
  {id:"marked_stavanger",    navn:"Coop Marked Hundvåg",      kjede:"COOP_MARKED",adresse:"Ryfylkegata 5",           sted:"Stavanger"},
  {id:"marked_tromso",       navn:"Coop Marked Tromsø",       kjede:"COOP_MARKED",adresse:"Mellomvegen 60",          sted:"Tromsø"},

  // ── ODA (nettbutikk) ─────────────────────────────────────────────────────
  {id:"oda_nett",            navn:"Oda (nettbutikk)",         kjede:"ODA",       adresse:"Levering hjem",            sted:"Hele landet"},
];

/* ════ KATEGORIER, MAKRO, NOVA, SIKKERHET ════ */
const KAT = [
  {id:"favoritter",navn:"⭐ Favoritter"},{id:"tilbud",navn:"🔵 På tilbud"},
  {id:"meieri",navn:"🥛 Meieri & egg"},{id:"kjott",navn:"🥩 Kjøtt"},{id:"fisk",navn:"🐟 Fisk & sjømat"},
  {id:"paalegg",navn:"🥪 Pålegg"},{id:"frukt",navn:"🍎 Frukt & grønt"},{id:"broed",navn:"🍞 Brød & bakst"},
  {id:"toerr",navn:"🌾 Tørrvarer"},{id:"drikke",navn:"🧃 Drikke"},{id:"frys",navn:"🧊 Frys"},
  {id:"saus",navn:"🫙 Sauser & krydder"},{id:"snacks",navn:"🍫 Snacks"},{id:"hygiene",navn:"🧴 Hygiene"},{id:"hjem",navn:"🏠 Hjem"},
];
const MAKRO_DEF = [
  {id:"kcal",navn:"Kalorier",enhet:"kcal",premium:false},{id:"protein",navn:"Protein",enhet:"g",premium:false},
  {id:"fett",navn:"Fett",enhet:"g",premium:true},{id:"karbo",navn:"Karbohydrater",enhet:"g",premium:true},
  {id:"fiber",navn:"Fiber",enhet:"g",premium:true},{id:"sukker",navn:"Sukker",enhet:"g",premium:true},
];
function novaInfo(n){
  if(n==null) return {farge:C.border,bg:C.bg,tekst:"Ukjent",kort:"Ukjent"};
  if(n===1) return {farge:C.ok,bg:C.okLys,tekst:"Ubearbeidet",kort:"Lite prosessert"};
  if(n===2) return {farge:"#558b2f",bg:"#f1f8e9",tekst:"Min. bearbeidet",kort:"Moderat"};
  if(n===3) return {farge:C.warn,bg:C.warnLys,tekst:"Bearbeidet",kort:"Bearbeidet"};
  return {farge:C.err,bg:C.errLys,tekst:"Ultraprosessert",kort:"Ultraprosessert"};
}
const KASSALAPP_KJEDER = new Set(["KIWI","MENY","SPAR","EUROSPAR","JOKER","NAERBUTIKKEN","COOP_EXTRA","COOP_OBS","COOP_PRIX","COOP_MEGA","COOP_MARKED","MATKROKEN","ODA"]);
const TRE_DAGER = 3 * 24 * 60 * 60 * 1000;

function prisSikkerhet(kilde, tid){
  if(kilde==="kassalapp") return {farge:C.ok, tekst:"Oppdatert", visStatus:true};
  if(kilde==="admin") return {farge:C.ok, tekst:"Oppdatert", visStatus:true};
  if(kilde==="rapport" && tid && Date.now()-tid < TRE_DAGER) return {farge:C.ok, tekst:"Oppdatert", visStatus:true};
  if(kilde==="rapport") return {farge:"#F59E0B", tekst:"Sist oppdatert 3+ dager siden", visStatus:true};
  // Simulerte priser viser ingen status – ikke forvirrende for brukeren
  return {farge:C.sub, tekst:"", visStatus:false};
}
function sikkerhet(s){ return prisSikkerhet(s, null); }

/* ════ PRODUKTKATALOG ════ */
const VARER = [
  {id:"helmelk_tine",navn:"Helmelk 1L",prod:"TINE",nova:1,kat:"meieri",m:{kcal:63,protein:3.4,fett:3.5,karbo:4.5,fiber:0,sukker:4.5}},
  {id:"lettmelk_tine",navn:"Lettmelk 0,5% 1L",prod:"TINE",nova:1,kat:"meieri",m:{kcal:38,protein:3.5,fett:0.5,karbo:4.7,fiber:0,sukker:4.7}},
  {id:"skummet_tine",navn:"Skummet Melk 1L",prod:"TINE",nova:1,kat:"meieri",m:{kcal:35,protein:3.5,fett:0.1,karbo:4.9,fiber:0,sukker:4.9}},
  {id:"helmelk_q",navn:"Helmelk 1L",prod:"Q-Meieriene",nova:1,kat:"meieri",m:{kcal:62,protein:3.4,fett:3.5,karbo:4.4,fiber:0,sukker:4.4}},
  {id:"havremelk_oatly",navn:"Havredrikk Original 1L",prod:"Oatly",nova:3,kat:"meieri",m:{kcal:46,protein:1,fett:1.5,karbo:6.6,fiber:0.8,sukker:4}},
  {id:"soyamelk_alpro",navn:"Soyadrikk Naturell 1L",prod:"Alpro",nova:3,kat:"meieri",m:{kcal:33,protein:3.3,fett:1.8,karbo:0.3,fiber:0.6,sukker:0.2}},
  {id:"egg12_prior",navn:"Egg Frittgående 12stk",prod:"Prior",nova:1,kat:"meieri",m:{kcal:149,protein:12.6,fett:10.6,karbo:0.3,fiber:0,sukker:0.3}},
  {id:"smor_tine",navn:"Meierismør 500g",prod:"TINE",nova:2,kat:"meieri",m:{kcal:736,protein:0.6,fett:82,karbo:0.6,fiber:0,sukker:0.6}},
  {id:"brelett",navn:"Brelett Original 540g",prod:"Mills",nova:4,kat:"meieri",m:{kcal:535,protein:0.5,fett:59,karbo:0.5,fiber:0,sukker:0.5}},
  {id:"roemme_tine",navn:"Seterrømme 35% 300ml",prod:"TINE",nova:2,kat:"meieri",m:{kcal:340,protein:2.2,fett:35,karbo:2.8,fiber:0,sukker:2.8}},
  {id:"creme_tine",navn:"Crème Fraîche 35% 300ml",prod:"TINE",nova:2,kat:"meieri",m:{kcal:333,protein:2.3,fett:34,karbo:3,fiber:0,sukker:3}},
  {id:"kremfloete_tine",navn:"Kremfløte 3dl",prod:"TINE",nova:1,kat:"meieri",m:{kcal:343,protein:2,fett:37,karbo:2.9,fiber:0,sukker:2.9}},
  {id:"yoghurt_tine",navn:"Yoghurt Naturell 600g",prod:"TINE",nova:2,kat:"meieri",m:{kcal:62,protein:3.5,fett:3.2,karbo:4.7,fiber:0,sukker:4.7}},
  {id:"gresk_tine",navn:"Gresk Yoghurt Naturell 850g",prod:"TINE",nova:2,kat:"meieri",m:{kcal:92,protein:5,fett:6.5,karbo:3.5,fiber:0,sukker:3.5}},
  {id:"skyr_tine",navn:"Skyr Naturell 450g",prod:"TINE",nova:2,kat:"meieri",m:{kcal:63,protein:11,fett:0.2,karbo:4,fiber:0,sukker:4}},
  {id:"skyr_arla",navn:"Skyr Naturell 500g",prod:"Arla",nova:2,kat:"meieri",m:{kcal:64,protein:11,fett:0.2,karbo:4,fiber:0,sukker:4}},
  {id:"cottage_tine",navn:"Cottage Cheese Original 400g",prod:"TINE",nova:2,kat:"meieri",m:{kcal:103,protein:13,fett:4.3,karbo:2.5,fiber:0,sukker:2.5}},
  {id:"kvarg_q",navn:"Skyr & Kvarg Naturell 500g",prod:"Q-Meieriene",nova:2,kat:"meieri",m:{kcal:57,protein:10,fett:0.2,karbo:4,fiber:0,sukker:4}},
  {id:"norvegia",navn:"Norvegia 26% Skorpefri 500g",prod:"TINE",nova:2,kat:"meieri",m:{kcal:351,protein:27,fett:27,karbo:0,fiber:0,sukker:0}},
  {id:"jarlsberg",navn:"Jarlsberg Original 500g",prod:"TINE",nova:2,kat:"meieri",m:{kcal:351,protein:27,fett:27,karbo:0,fiber:0,sukker:0}},
  {id:"brunost",navn:"Gudbrandsdalsost 500g",prod:"TINE",nova:2,kat:"meieri",m:{kcal:466,protein:9.5,fett:29,karbo:42,fiber:0,sukker:32}},
  {id:"mozzarella",navn:"Mozzarella 125g",prod:"Santa Lucia",nova:2,kat:"meieri",m:{kcal:253,protein:18,fett:20,karbo:1,fiber:0,sukker:1}},
  {id:"feta_apetina",navn:"Salatost Classic 200g",prod:"Apetina",nova:2,kat:"meieri",m:{kcal:230,protein:14,fett:19,karbo:1,fiber:0,sukker:1}},
  {id:"philadelphia",navn:"Kremost Original 200g",prod:"Philadelphia",nova:3,kat:"meieri",m:{kcal:253,protein:6,fett:24,karbo:4,fiber:0,sukker:4}},
  {id:"kyllingfilet_prior",navn:"Kyllingfilet Naturell 600g",prod:"Prior",nova:1,kat:"kjott",m:{kcal:106,protein:23,fett:1.3,karbo:0,fiber:0,sukker:0}},
  {id:"kyllinglaar_prior",navn:"Kyllinglår 700g",prod:"Prior",nova:1,kat:"kjott",m:{kcal:185,protein:18,fett:12,karbo:0,fiber:0,sukker:0}},
  {id:"kjottdeig_gilde",navn:"Kjøttdeig av Storfe 14% 400g",prod:"Gilde",nova:2,kat:"kjott",m:{kcal:199,protein:19,fett:14,karbo:0,fiber:0,sukker:0}},
  {id:"karbonade_gilde",navn:"Karbonadedeig 5% 400g",prod:"Gilde",nova:2,kat:"kjott",m:{kcal:131,protein:21,fett:5,karbo:0,fiber:0,sukker:0}},
  {id:"kjottdeig_first",navn:"Kjøttdeig 400g",prod:"First Price",nova:2,kat:"kjott",m:{kcal:212,protein:18,fett:16,karbo:0,fiber:0,sukker:0}},
  {id:"svinekotelett",navn:"Svinekotelett 600g",prod:"Gilde",nova:1,kat:"kjott",m:{kcal:172,protein:21,fett:10,karbo:0,fiber:0,sukker:0}},
  {id:"biff_gilde",navn:"Mørbradbiff av Storfe 400g",prod:"Gilde",nova:1,kat:"kjott",m:{kcal:143,protein:22,fett:6,karbo:0,fiber:0,sukker:0}},
  {id:"kjottboller_fersk",navn:"Kjøttboller 500g",prod:"Gilde",nova:4,kat:"kjott",m:{kcal:215,protein:13,fett:16,karbo:6,fiber:0.5,sukker:1}},
  {id:"lammekjott",navn:"Lammelår 1,5kg",prod:"Gilde",nova:1,kat:"kjott",m:{kcal:201,protein:18,fett:14,karbo:0,fiber:0,sukker:0}},
  {id:"laks_salma",navn:"Laksefilet Naturell 240g",prod:"Salma",nova:1,kat:"fisk",m:{kcal:208,protein:20,fett:14,karbo:0,fiber:0,sukker:0}},
  {id:"laks_leroy",navn:"Laksefilet 400g",prod:"Lerøy",nova:1,kat:"fisk",m:{kcal:208,protein:20,fett:14,karbo:0,fiber:0,sukker:0}},
  {id:"torsk_leroy",navn:"Torskefilet 400g",prod:"Lerøy",nova:1,kat:"fisk",m:{kcal:82,protein:18,fett:0.7,karbo:0,fiber:0,sukker:0}},
  {id:"reker_lyngs",navn:"Ferske Reker 500g",prod:"Lyngs",nova:1,kat:"fisk",m:{kcal:99,protein:21,fett:1.2,karbo:0,fiber:0,sukker:0}},
  {id:"tunfisk_first",navn:"Tunfisk i Vann 185g",prod:"First Price",nova:2,kat:"fisk",m:{kcal:103,protein:24,fett:0.8,karbo:0,fiber:0,sukker:0}},
  {id:"makrell_stabbur",navn:"Makrell i Tomat 110g",prod:"Stabbur-Makrell",nova:3,kat:"fisk",m:{kcal:201,protein:12,fett:14,karbo:6,fiber:0.5,sukker:4}},
  {id:"sardiner_king",navn:"Sardiner i Olivenolje 106g",prod:"King Oscar",nova:2,kat:"fisk",m:{kcal:220,protein:23,fett:14,karbo:0,fiber:0,sukker:0}},
  {id:"fiskekaker",navn:"Fiskekaker 500g",prod:"Lofoten",nova:3,kat:"fisk",m:{kcal:140,protein:11,fett:8,karbo:6,fiber:0.5,sukker:1}},
  {id:"sild_tomat",navn:"Sild i Tomat 190g",prod:"Lofoten",nova:3,kat:"fisk",m:{kcal:190,protein:13,fett:12,karbo:7,fiber:0.5,sukker:5}},
  {id:"skinke_gilde",navn:"Kokt Skinke 110g",prod:"Gilde",nova:4,kat:"paalegg",m:{kcal:108,protein:18,fett:3.5,karbo:1,fiber:0,sukker:1}},
  {id:"skinke_ngod",navn:"Naturlig God Kokt Skinke 90g",prod:"Gilde",nova:3,kat:"paalegg",m:{kcal:104,protein:19,fett:2.8,karbo:0.5,fiber:0,sukker:0.5}},
  {id:"spekeskinke_gilde",navn:"Spekeskinke 80g",prod:"Gilde",nova:3,kat:"paalegg",m:{kcal:240,protein:30,fett:13,karbo:0,fiber:0,sukker:0}},
  {id:"fenalar_gilde",navn:"Fenalår i Skiver 80g",prod:"Gilde",nova:3,kat:"paalegg",m:{kcal:230,protein:32,fett:11,karbo:0,fiber:0,sukker:0}},
  {id:"salami_gilde",navn:"Salami 90g",prod:"Gilde",nova:4,kat:"paalegg",m:{kcal:378,protein:21,fett:33,karbo:1,fiber:0,sukker:1}},
  {id:"leverpostei_stab",navn:"Leverpostei Ovnsbakt 200g",prod:"Stabburet",nova:4,kat:"paalegg",m:{kcal:282,protein:9,fett:25,karbo:6,fiber:0.5,sukker:1}},
  {id:"bacon_gilde",navn:"Bacon i Skiver 140g",prod:"Gilde",nova:4,kat:"paalegg",m:{kcal:330,protein:16,fett:29,karbo:0.5,fiber:0,sukker:0.5}},
  {id:"kaviar_mills",navn:"Kaviar Original 185g",prod:"Mills",nova:4,kat:"paalegg",m:{kcal:240,protein:11,fett:14,karbo:17,fiber:0,sukker:6}},
  {id:"rokt_laks_leroy",navn:"Røkt Laks 100g",prod:"Lerøy",nova:3,kat:"paalegg",m:{kcal:184,protein:21,fett:11,karbo:0,fiber:0,sukker:0}},
  {id:"peanottsmor",navn:"Peanøttsmør Crunchy 350g",prod:"Sun-Pat",nova:3,kat:"paalegg",m:{kcal:600,protein:25,fett:50,karbo:12,fiber:6,sukker:6}},
  {id:"nugatti",navn:"Nugatti 500g",prod:"Nidar",nova:4,kat:"paalegg",m:{kcal:540,protein:6,fett:31,karbo:57,fiber:3,sukker:50}},
  {id:"banan_bama",navn:"Bananer løsvekt (pr kg)",prod:"Bama",nova:1,kat:"frukt",m:{kcal:89,protein:1.1,fett:0.3,karbo:21,fiber:2.6,sukker:12}},
  {id:"eple_royal",navn:"Epler Royal Gala (pr kg)",prod:"Bama",nova:1,kat:"frukt",m:{kcal:52,protein:0.3,fett:0.2,karbo:11,fiber:2.4,sukker:10}},
  {id:"appelsin_bama",navn:"Appelsiner Nettpose 1kg",prod:"Bama",nova:1,kat:"frukt",m:{kcal:47,protein:0.9,fett:0.1,karbo:9,fiber:2.4,sukker:9}},
  {id:"paere_bama",navn:"Pærer Conference (pr kg)",prod:"Bama",nova:1,kat:"frukt",m:{kcal:57,protein:0.4,fett:0.1,karbo:12,fiber:3.1,sukker:10}},
  {id:"druer_bama",navn:"Druer Grønne 500g",prod:"Bama",nova:1,kat:"frukt",m:{kcal:69,protein:0.7,fett:0.2,karbo:16,fiber:0.9,sukker:16}},
  {id:"avokado_bama",navn:"Avokado Spiseklar 2pk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:160,protein:2,fett:15,karbo:2,fiber:7,sukker:0.7}},
  {id:"mango_bama",navn:"Mango Spiseklar stk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:60,protein:0.8,fett:0.4,karbo:13,fiber:1.6,sukker:14}},
  {id:"sitron_bama",navn:"Sitron Nett 4stk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:29,protein:1.1,fett:0.3,karbo:3,fiber:2.8,sukker:2.5}},
  {id:"jordbar_bama",navn:"Jordbær 400g",prod:"Bama",nova:1,kat:"frukt",m:{kcal:32,protein:0.7,fett:0.3,karbo:6,fiber:2,sukker:5}},
  {id:"blabar_bama",navn:"Blåbær 125g",prod:"Bama",nova:1,kat:"frukt",m:{kcal:57,protein:0.7,fett:0.3,karbo:14,fiber:2.4,sukker:10}},
  {id:"tomat_bama",navn:"Tomat løsvekt (pr kg)",prod:"Bama",nova:1,kat:"frukt",m:{kcal:18,protein:0.9,fett:0.2,karbo:3.9,fiber:1.2,sukker:2.6}},
  {id:"cherrytom_bama",navn:"Cherrytomater 250g",prod:"Bama",nova:1,kat:"frukt",m:{kcal:18,protein:0.9,fett:0.2,karbo:3.9,fiber:1.2,sukker:2.6}},
  {id:"agurk_bama",navn:"Slangeagurk stk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:15,protein:0.7,fett:0.1,karbo:3.6,fiber:0.5,sukker:1.7}},
  {id:"paprika_bama",navn:"Paprika Rød stk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:31,protein:1,fett:0.3,karbo:6,fiber:2.1,sukker:4.2}},
  {id:"gulrot_bama",navn:"Gulrøtter 1kg",prod:"Bama",nova:1,kat:"frukt",m:{kcal:41,protein:0.9,fett:0.2,karbo:7,fiber:2.8,sukker:4.7}},
  {id:"brokkoli_bama",navn:"Brokkoli stk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:34,protein:2.8,fett:0.4,karbo:4,fiber:2.6,sukker:1.7}},
  {id:"blomkal_bama",navn:"Blomkål stk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:25,protein:1.9,fett:0.3,karbo:3,fiber:2,sukker:1.9}},
  {id:"spinat_bama",navn:"Babyspinat 65g",prod:"Bama",nova:1,kat:"frukt",m:{kcal:23,protein:2.9,fett:0.4,karbo:1.4,fiber:2.2,sukker:0.4}},
  {id:"salat_bama",navn:"Salathjerter 2pk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:15,protein:1.4,fett:0.2,karbo:1.5,fiber:1.3,sukker:1}},
  {id:"loek_bama",navn:"Løk Gul Nett 1kg",prod:"Bama",nova:1,kat:"frukt",m:{kcal:40,protein:1.1,fett:0.1,karbo:7,fiber:1.7,sukker:5}},
  {id:"hvitlok_bama",navn:"Hvitløk 3pk",prod:"Bama",nova:1,kat:"frukt",m:{kcal:149,protein:6,fett:0.5,karbo:28,fiber:2.1,sukker:1}},
  {id:"potet_bama",navn:"Poteter 2kg",prod:"Bama",nova:1,kat:"frukt",m:{kcal:77,protein:2,fett:0.1,karbo:16,fiber:2.2,sukker:0.8}},
  {id:"sotpotet_bama",navn:"Søtpotet løsvekt (pr kg)",prod:"Bama",nova:1,kat:"frukt",m:{kcal:86,protein:1.6,fett:0.1,karbo:20,fiber:3,sukker:4.2}},
  {id:"sopp_bama",navn:"Sjampinjong 250g",prod:"Bama",nova:1,kat:"frukt",m:{kcal:22,protein:3.1,fett:0.3,karbo:0.4,fiber:1,sukker:0.2}},
  {id:"grovbrod_mester",navn:"Grovbrød Helkorn 750g",prod:"Mesterbakeren",nova:3,kat:"broed",m:{kcal:240,protein:9,fett:3.5,karbo:42,fiber:7,sukker:3}},
  {id:"loff_bakers",navn:"Loff 500g",prod:"Bakers",nova:3,kat:"broed",m:{kcal:265,protein:8,fett:3,karbo:50,fiber:3,sukker:4}},
  {id:"rugbrod_mester",navn:"Rugbrød 750g",prod:"Mesterbakeren",nova:3,kat:"broed",m:{kcal:230,protein:7,fett:2.5,karbo:43,fiber:8,sukker:3}},
  {id:"wasa_orig",navn:"Wasa Original 275g",prod:"Wasa",nova:2,kat:"broed",m:{kcal:340,protein:10,fett:1.5,karbo:62,fiber:18,sukker:1}},
  {id:"wasa_grov",navn:"Wasa Sport 275g",prod:"Wasa",nova:2,kat:"broed",m:{kcal:333,protein:11,fett:3,karbo:58,fiber:17,sukker:1.5}},
  {id:"riskaker",navn:"Riskaker Naturell 130g",prod:"Sunniva",nova:2,kat:"broed",m:{kcal:387,protein:8,fett:3,karbo:81,fiber:4,sukker:0.5}},
  {id:"pita_hatting",navn:"Pitabrød 6pk",prod:"Hatting",nova:3,kat:"broed",m:{kcal:275,protein:9,fett:2,karbo:54,fiber:3,sukker:3}},
  {id:"tortilla_oep",navn:"Tortilla Original 8pk",prod:"Old El Paso",nova:4,kat:"broed",m:{kcal:298,protein:8,fett:7,karbo:50,fiber:3,sukker:3}},
  {id:"spaghetti_bar",navn:"Spaghetti n.5 500g",prod:"Barilla",nova:2,kat:"toerr",m:{kcal:359,protein:13,fett:2,karbo:71,fiber:3,sukker:3.5}},
  {id:"penne_bar",navn:"Penne Rigate 500g",prod:"Barilla",nova:2,kat:"toerr",m:{kcal:359,protein:13,fett:2,karbo:71,fiber:3,sukker:3.5}},
  {id:"lasagne_bar",navn:"Lasagne Plater 500g",prod:"Barilla",nova:2,kat:"toerr",m:{kcal:359,protein:13,fett:2,karbo:71,fiber:3,sukker:3.5}},
  {id:"basmati_tilda",navn:"Basmatiris 1kg",prod:"Tilda",nova:1,kat:"toerr",m:{kcal:349,protein:8,fett:0.9,karbo:78,fiber:1.4,sukker:0.1}},
  {id:"jasminris",navn:"Jasminris 1kg",prod:"First Price",nova:1,kat:"toerr",m:{kcal:351,protein:7,fett:0.7,karbo:79,fiber:1,sukker:0.1}},
  {id:"havregryn_axa",navn:"Havregryn Lettkokte 1kg",prod:"AXA",nova:1,kat:"toerr",m:{kcal:370,protein:13,fett:7,karbo:59,fiber:10,sukker:1}},
  {id:"musli_axa",navn:"Frokostblanding Naturell 750g",prod:"AXA",nova:3,kat:"toerr",m:{kcal:380,protein:9,fett:7,karbo:65,fiber:8,sukker:15}},
  {id:"cornflakes_kel",navn:"Corn Flakes 500g",prod:"Kellogg's",nova:4,kat:"toerr",m:{kcal:378,protein:7,fett:0.9,karbo:84,fiber:3,sukker:8}},
  {id:"mel_mollerens",navn:"Hvetemel Siktet 2kg",prod:"Møllerens",nova:2,kat:"toerr",m:{kcal:340,protein:11,fett:1.3,karbo:70,fiber:3,sukker:1}},
  {id:"sukker_dansukker",navn:"Sukker Strøsukker 1kg",prod:"Dan Sukker",nova:2,kat:"toerr",m:{kcal:400,protein:0,fett:0,karbo:100,fiber:0,sukker:100}},
  {id:"tomat_mutti",navn:"Hakkede Tomater 400g",prod:"Mutti",nova:2,kat:"toerr",m:{kcal:25,protein:1.2,fett:0.2,karbo:4,fiber:1,sukker:3.5}},
  {id:"tomatpure_mutti",navn:"Tomatpuré 130g",prod:"Mutti",nova:2,kat:"toerr",m:{kcal:82,protein:4,fett:0.5,karbo:14,fiber:3,sukker:11}},
  {id:"kokosmelk_aroy",navn:"Kokosmelk 400ml",prod:"Aroy-D",nova:2,kat:"toerr",m:{kcal:197,protein:2,fett:20,karbo:3,fiber:0,sukker:2}},
  {id:"linser_go",navn:"Røde Linser 500g",prod:"Go Green",nova:1,kat:"toerr",m:{kcal:341,protein:24,fett:1.5,karbo:48,fiber:11,sukker:2}},
  {id:"kikerter_go",navn:"Kikerter 380g",prod:"Go Green",nova:2,kat:"toerr",m:{kcal:119,protein:7,fett:2,karbo:16,fiber:5,sukker:0.5}},
  {id:"quinoa_go",navn:"Quinoa 500g",prod:"Go Green",nova:1,kat:"toerr",m:{kcal:368,protein:14,fett:6,karbo:57,fiber:7,sukker:1.6}},
  {id:"farris",navn:"Farris Naturell 1,5L",prod:"Farris",nova:1,kat:"drikke",m:{kcal:0,protein:0,fett:0,karbo:0,fiber:0,sukker:0}},
  {id:"imsdal",navn:"Imsdal Naturell 1,5L",prod:"Imsdal",nova:1,kat:"drikke",m:{kcal:0,protein:0,fett:0,karbo:0,fiber:0,sukker:0}},
  {id:"appjuice_sunniva",navn:"Appelsinjuice 1L",prod:"Sunniva",nova:2,kat:"drikke",m:{kcal:45,protein:0.7,fett:0.2,karbo:9,fiber:0.2,sukker:9}},
  {id:"kaffe_friele",navn:"Frokostkaffe Filtermalt 250g",prod:"Friele",nova:1,kat:"drikke",m:{kcal:2,protein:0.1,fett:0,karbo:0,fiber:0,sukker:0}},
  {id:"te_lipton",navn:"Yellow Label Te 25pk",prod:"Lipton",nova:1,kat:"drikke",m:{kcal:1,protein:0,fett:0,karbo:0,fiber:0,sukker:0}},
  {id:"cola_15",navn:"Coca-Cola 1,5L",prod:"Coca-Cola",nova:4,kat:"drikke",m:{kcal:42,protein:0,fett:0,karbo:10.6,fiber:0,sukker:10.6}},
  {id:"colazero_15",navn:"Coca-Cola Zero 1,5L",prod:"Coca-Cola",nova:4,kat:"drikke",m:{kcal:0.3,protein:0,fett:0,karbo:0,fiber:0,sukker:0}},
  {id:"pepsimax",navn:"Pepsi Max 1,5L",prod:"PepsiCo",nova:4,kat:"drikke",m:{kcal:0.3,protein:0,fett:0,karbo:0,fiber:0,sukker:0}},
  {id:"solo_15",navn:"Solo 1,5L",prod:"Ringnes",nova:4,kat:"drikke",m:{kcal:46,protein:0,fett:0,karbo:11,fiber:0,sukker:11}},
  {id:"erter_findus",navn:"Erter 450g (frossen)",prod:"Findus",nova:1,kat:"frys",m:{kcal:81,protein:5.4,fett:0.5,karbo:11,fiber:5,sukker:3}},
  {id:"wokgront_findus",navn:"Wokgrønnsaker 500g (frossen)",prod:"Findus",nova:1,kat:"frys",m:{kcal:40,protein:2,fett:0.5,karbo:6,fiber:2.5,sukker:3}},
  {id:"spinat_findus",navn:"Hakket Spinat 600g (frossen)",prod:"Findus",nova:1,kat:"frys",m:{kcal:23,protein:2.9,fett:0.4,karbo:1.4,fiber:2.2,sukker:0.4}},
  {id:"bringebar_frys",navn:"Bringebær 250g (frossen)",prod:"Bama",nova:1,kat:"frys",m:{kcal:52,protein:1.2,fett:0.7,karbo:9,fiber:6.5,sukker:4.4}},
  {id:"pommes_findus",navn:"Pommes Frites 900g",prod:"Findus",nova:3,kat:"frys",m:{kcal:152,protein:2.5,fett:4.5,karbo:24,fiber:2.5,sukker:0.5}},
  {id:"reker_frys",navn:"Pillede Reker 200g (frossen)",prod:"Lyngs",nova:2,kat:"frys",m:{kcal:99,protein:21,fett:1.2,karbo:0,fiber:0,sukker:0}},
  {id:"laks_frys",navn:"Laksefilet 400g (frossen)",prod:"Lerøy",nova:1,kat:"frys",m:{kcal:208,protein:20,fett:14,karbo:0,fiber:0,sukker:0}},
  {id:"fiskepinner",navn:"Fiskepinner 450g",prod:"Findus",nova:4,kat:"frys",m:{kcal:200,protein:11,fett:9,karbo:18,fiber:1,sukker:1}},
  {id:"grandiosa",navn:"Grandiosa Original 555g",prod:"Stabburet",nova:4,kat:"frys",m:{kcal:230,protein:9,fett:8,karbo:30,fiber:2,sukker:3}},
  {id:"iskrem_diplom",navn:"Vaniljeis Beger 1,5L",prod:"Diplom-Is",nova:4,kat:"frys",m:{kcal:207,protein:3,fett:11,karbo:23,fiber:0,sukker:21}},
  {id:"olivenolje_eldorado",navn:"Olivenolje Extra Virgin 500ml",prod:"Eldorado",nova:2,kat:"saus",m:{kcal:824,protein:0,fett:91,karbo:0,fiber:0,sukker:0}},
  {id:"rapsolje_mills",navn:"Rapsolje 1L",prod:"Mills",nova:2,kat:"saus",m:{kcal:828,protein:0,fett:92,karbo:0,fiber:0,sukker:0}},
  {id:"ketchup_heinz",navn:"Tomatketchup 570g",prod:"Heinz",nova:4,kat:"saus",m:{kcal:102,protein:1.2,fett:0.1,karbo:23,fiber:0.5,sukker:22}},
  {id:"sennep_idun",navn:"Sennep Mild 250g",prod:"Idun",nova:3,kat:"saus",m:{kcal:160,protein:6,fett:8,karbo:14,fiber:2,sukker:11}},
  {id:"majones_mills",navn:"Majones Original 160g",prod:"Mills",nova:4,kat:"saus",m:{kcal:680,protein:1,fett:75,karbo:2,fiber:0,sukker:2}},
  {id:"soyasaus_kikkoman",navn:"Soyasaus 150ml",prod:"Kikkoman",nova:3,kat:"saus",m:{kcal:77,protein:10,fett:0,karbo:8,fiber:0,sukker:1}},
  {id:"pesto_barilla",navn:"Pesto alla Genovese 190g",prod:"Barilla",nova:3,kat:"saus",m:{kcal:450,protein:5,fett:45,karbo:6,fiber:2,sukker:3}},
  {id:"honning_lerum",navn:"Honning Flytende 350g",prod:"Lerum",nova:1,kat:"saus",m:{kcal:329,protein:0.3,fett:0,karbo:82,fiber:0,sukker:82}},
  {id:"syltetoy_nora",navn:"Bringebærsyltetøy 400g",prod:"Nora",nova:3,kat:"saus",m:{kcal:230,protein:0.4,fett:0.2,karbo:56,fiber:1,sukker:55}},
  {id:"salt_jozo",navn:"Bordsalt 1kg",prod:"Jozo",nova:2,kat:"saus",m:{kcal:0,protein:0,fett:0,karbo:0,fiber:0,sukker:0}},
  {id:"pepper_hindu",navn:"Sort Pepper Kvern 50g",prod:"Hindu",nova:1,kat:"saus",m:{kcal:251,protein:10,fett:3,karbo:64,fiber:25,sukker:1}},
  {id:"karri_hindu",navn:"Karri Sterk 40g",prod:"Hindu",nova:1,kat:"saus",m:{kcal:325,protein:13,fett:14,karbo:58,fiber:33,sukker:3}},
  {id:"mandler_eldorado",navn:"Mandler Naturell 200g",prod:"Eldorado",nova:1,kat:"snacks",m:{kcal:599,protein:21,fett:50,karbo:9,fiber:12,sukker:4}},
  {id:"cashew_eldorado",navn:"Cashewnøtter Naturell 200g",prod:"Eldorado",nova:1,kat:"snacks",m:{kcal:580,protein:18,fett:46,karbo:27,fiber:3,sukker:6}},
  {id:"valnotter",navn:"Valnøtter 200g",prod:"Eldorado",nova:1,kat:"snacks",m:{kcal:688,protein:15,fett:65,karbo:11,fiber:6,sukker:2.6}},
  {id:"rosiner_sunmaid",navn:"Rosiner 250g",prod:"Sun-Maid",nova:1,kat:"snacks",m:{kcal:299,protein:3,fett:0.5,karbo:71,fiber:4,sukker:65}},
  {id:"mork_sjok_freia",navn:"Kokesjokolade Mørk 200g",prod:"Freia",nova:3,kat:"snacks",m:{kcal:500,protein:5,fett:30,karbo:55,fiber:7,sukker:48}},
  {id:"melkesjok_freia",navn:"Melkesjokolade 200g",prod:"Freia",nova:4,kat:"snacks",m:{kcal:535,protein:7,fett:31,karbo:57,fiber:2,sukker:56}},
  {id:"kvikklunsj",navn:"Kvikk Lunsj 3-pk",prod:"Freia",nova:4,kat:"snacks",m:{kcal:510,protein:6,fett:27,karbo:60,fiber:3,sukker:42}},
  {id:"potetgull_maarud",navn:"Potetgull Original 250g",prod:"Maarud",nova:4,kat:"snacks",m:{kcal:535,protein:6,fett:34,karbo:50,fiber:4,sukker:1}},
  {id:"popcorn",navn:"Mikropopcorn Salt 3pk",prod:"Eldorado",nova:3,kat:"snacks",m:{kcal:480,protein:9,fett:24,karbo:55,fiber:9,sukker:1}},
  {id:"digestive",navn:"Digestive 400g",prod:"McVitie's",nova:4,kat:"snacks",m:{kcal:471,protein:7,fett:21,karbo:62,fiber:4,sukker:17}},
  {id:"dopapir_lambi",navn:"Toalettpapir 3-lags 12rl",prod:"Lambi",nova:null,kat:"hygiene"},
  {id:"kjokkenrull_lambi",navn:"Kjøkkenrull 4rl",prod:"Lambi",nova:null,kat:"hygiene"},
  {id:"tannkrem_colgate",navn:"Tannkrem Total 75ml",prod:"Colgate",nova:null,kat:"hygiene"},
  {id:"sjampo_hs",navn:"Shampoo Classic Clean 360ml",prod:"Head & Shoulders",nova:null,kat:"hygiene"},
  {id:"dusjsape_dove",navn:"Dusjsåpe Original 250ml",prod:"Dove",nova:null,kat:"hygiene"},
  {id:"deo_dove",navn:"Deodorant Roll-on 50ml",prod:"Dove",nova:null,kat:"hygiene"},
  {id:"plaster_salvequick",navn:"Plaster Assortert 40pk",prod:"Salvequick",nova:null,kat:"hygiene"},
  {id:"paracet",navn:"Paracet 500mg 20stk",prod:"Karo Pharma",nova:null,kat:"hygiene"},
  {id:"vaskemiddel_omo",navn:"Color Vaskemiddel 750ml",prod:"OMO",nova:null,kat:"hjem"},
  {id:"zalo",navn:"Oppvaskmiddel Original 500ml",prod:"Zalo",nova:null,kat:"hjem"},
  {id:"finish",navn:"Oppvasktabletter All in 1 (40stk)",prod:"Finish",nova:null,kat:"hjem"},
  {id:"soppelpose_30l",navn:"Avfallsposer 30L 40stk",prod:"First Price",nova:null,kat:"hjem"},
  {id:"fryseposer_toppits",navn:"Fryseposer 3L 30stk",prod:"Toppits",nova:null,kat:"hjem"},
  {id:"batterier_duracell",navn:"Batterier AA 4pk",prod:"Duracell",nova:null,kat:"hjem"},
];

/* ════ BASISPRISER (nasjonal listepris, kr) ════ */
const BASIS = {
  helmelk_tine:24.9,lettmelk_tine:23.9,skummet_tine:23.9,helmelk_q:25.9,havremelk_oatly:32.9,soyamelk_alpro:29.9,
  egg12_prior:54.9,smor_tine:52.9,brelett:39.9,roemme_tine:26.9,creme_tine:29.9,kremfloete_tine:25.9,
  yoghurt_tine:27.9,gresk_tine:39.9,skyr_tine:32.9,skyr_arla:31.9,cottage_tine:29.9,kvarg_q:31.9,
  norvegia:99.9,jarlsberg:109,brunost:89.9,mozzarella:19.9,feta_apetina:32.9,philadelphia:32.9,
  kyllingfilet_prior:109,kyllinglaar_prior:79.9,kjottdeig_gilde:69.9,karbonade_gilde:79.9,kjottdeig_first:49.9,
  svinekotelett:89.9,biff_gilde:129,kjottboller_fersk:59.9,lammekjott:249,
  laks_salma:119,laks_leroy:129,torsk_leroy:99.9,reker_lyngs:149,tunfisk_first:19.9,makrell_stabbur:22.9,
  sardiner_king:29.9,fiskekaker:49.9,sild_tomat:34.9,
  skinke_gilde:29.9,skinke_ngod:32.9,spekeskinke_gilde:49.9,fenalar_gilde:59.9,salami_gilde:32.9,
  leverpostei_stab:24.9,bacon_gilde:44.9,kaviar_mills:36.9,rokt_laks_leroy:59.9,peanottsmor:49.9,nugatti:54.9,
  banan_bama:24.9,eple_royal:29.9,appelsin_bama:29.9,paere_bama:34.9,druer_bama:39.9,avokado_bama:35.9,
  mango_bama:25.9,sitron_bama:29.9,jordbar_bama:49.9,blabar_bama:39.9,tomat_bama:39.9,cherrytom_bama:29.9,
  agurk_bama:19.9,paprika_bama:16.9,gulrot_bama:19.9,brokkoli_bama:22.9,blomkal_bama:29.9,spinat_bama:24.9,
  salat_bama:29.9,loek_bama:19.9,hvitlok_bama:19.9,potet_bama:34.9,sotpotet_bama:29.9,sopp_bama:29.9,
  grovbrod_mester:39.9,loff_bakers:29.9,rugbrod_mester:44.9,wasa_orig:29.9,wasa_grov:29.9,riskaker:24.9,
  pita_hatting:24.9,tortilla_oep:34.9,
  spaghetti_bar:24.9,penne_bar:24.9,lasagne_bar:29.9,basmati_tilda:49.9,jasminris:32.9,havregryn_axa:24.9,
  musli_axa:39.9,cornflakes_kel:39.9,mel_mollerens:29.9,sukker_dansukker:29.9,tomat_mutti:19.9,
  tomatpure_mutti:14.9,kokosmelk_aroy:22.9,linser_go:29.9,kikerter_go:14.9,quinoa_go:49.9,
  farris:29.9,imsdal:27.9,appjuice_sunniva:32.9,kaffe_friele:49.9,te_lipton:29.9,cola_15:36.9,
  colazero_15:36.9,pepsimax:34.9,solo_15:36.9,
  erter_findus:24.9,wokgront_findus:29.9,spinat_findus:24.9,bringebar_frys:39.9,pommes_findus:34.9,
  reker_frys:59.9,laks_frys:99.9,fiskepinner:49.9,grandiosa:49.9,iskrem_diplom:49.9,
  olivenolje_eldorado:89.9,rapsolje_mills:49.9,ketchup_heinz:39.9,sennep_idun:24.9,majones_mills:29.9,
  soyasaus_kikkoman:39.9,pesto_barilla:34.9,honning_lerum:59.9,syltetoy_nora:39.9,salt_jozo:14.9,
  pepper_hindu:39.9,karri_hindu:24.9,
  mandler_eldorado:39.9,cashew_eldorado:44.9,valnotter:49.9,rosiner_sunmaid:24.9,mork_sjok_freia:34.9,
  melkesjok_freia:44.9,kvikklunsj:39.9,potetgull_maarud:39.9,popcorn:24.9,digestive:32.9,
  dopapir_lambi:59.9,kjokkenrull_lambi:39.9,tannkrem_colgate:29.9,sjampo_hs:49.9,dusjsape_dove:32.9,
  deo_dove:39.9,plaster_salvequick:39.9,paracet:39.9,
  vaskemiddel_omo:79.9,zalo:32.9,finish:99.9,soppelpose_30l:19.9,fryseposer_toppits:24.9,batterier_duracell:49.9,
};
const KJEDEFAKTOR = {
  KIWI:0.97, REMA_1000:0.96, COOP_EXTRA:0.98, COOP_OBS:0.97, COOP_PRIX:1.0,
  COOP_MEGA:1.06, COOP_MARKED:1.05, BUNNPRIS:1.0, MENY:1.12, SPAR:1.08,
  EUROSPAR:1.09, JOKER:1.18, NAERBUTIKKEN:1.22, MATKROKEN:1.25,
  EUROPRIS:0.94, FUDI:0.93, HAVARISTEN:0.89, GIGABOKS:0.88, ODA:1.04,
};

// 246 Rema 1000-butikker hentet fra zpinmedia.com/embed/rema.no
const REMA_BUTIKKER = [
  {id:"rema_1",navn:"Rema 1000 Lynghaugparken",kjede:"REMA_1000",adresse:"Dag Hammerskjøldsvei 1",sted:"Fyllingsdalen",lat:60.356618,lng:5.293971},
  {id:"rema_2",navn:"Rema 1000 Vinjesgate",kjede:"REMA_1000",adresse:"Vinjes gate 2",sted:"Drammen",lat:59.747008,lng:10.192102},
  {id:"rema_3",navn:"Rema 1000 Orkidehøgda",kjede:"REMA_1000",adresse:"Orkidehøgda 11",sted:"Mjøndalen",lat:59.748212,lng:10.027953},
  {id:"rema_4",navn:"Rema 1000 Lierstranda",kjede:"REMA_1000",adresse:"Lierstranda 93",sted:"Lierstranda",lat:59.749305,lng:10.246724},
  {id:"rema_5",navn:"Rema 1000 Skreppestad",kjede:"REMA_1000",adresse:"Skreppestadveien 34",sted:"Larvik",lat:59.045523,lng:10.075227},
  {id:"rema_6",navn:"Rema 1000 Spikkestad",kjede:"REMA_1000",adresse:"Spikkestadveien 128",sted:"Spikkestad",lat:59.744136,lng:10.339272},
  {id:"rema_7",navn:"Rema 1000 Saupstad",kjede:"REMA_1000",adresse:"Reier Søbstads veg 3",sted:"Trondheim",lat:63.366631,lng:10.345429},
  {id:"rema_8",navn:"Rema 1000 Bytunet",kjede:"REMA_1000",adresse:"Haraldsgaten 177",sted:"Haugesund",lat:59.414802,lng:5.267208},
  {id:"rema_9",navn:"Rema 1000 Gulskogen",kjede:"REMA_1000",adresse:"Professor Smiths alle 54A",sted:"Drammen",lat:59.742047,lng:10.162395},
  {id:"rema_10",navn:"Rema 1000 Stadionparken",kjede:"REMA_1000",adresse:"Jåttåvågveien 10",sted:"Stavanger",lat:58.914785,lng:5.730085},
  {id:"rema_11",navn:"Rema 1000 Skårer",kjede:"REMA_1000",adresse:"Skårersletta 55",sted:"Lørenskog",lat:59.92182,lng:10.95266},
  {id:"rema_12",navn:"Innom Birkelunden",kjede:"REMA_1000",adresse:"Thorvald Meyers gate 23A",sted:"Oslo",lat:59.927303,lng:10.758948},
  {id:"rema_13",navn:"Rema 1000 Kuven Stasjon",kjede:"REMA_1000",adresse:"Byvegen 85",sted:"Os",lat:60.192638,lng:5.46487},
  {id:"rema_14",navn:"Rema 1000 Storsvingen",kjede:"REMA_1000",adresse:"Storsvingen 4",sted:"Rypefjord",lat:70.652460,lng:23.663436},
  {id:"rema_15",navn:"Rema 1000 Dragvoll",kjede:"REMA_1000",adresse:"Gamle Jonsvannsveien 45",sted:"Trondheim",lat:63.411677,lng:10.464533},
  {id:"rema_16",navn:"Rema 1000 Hurrahølet",kjede:"REMA_1000",adresse:"Langnesveien 2",sted:"Askim",lat:59.584573,lng:11.134930},
  {id:"rema_17",navn:"Rema 1000 Åråsen",kjede:"REMA_1000",adresse:"Åråssvingen 9",sted:"Kjeller",lat:59.963865,lng:11.064039},
  {id:"rema_18",navn:"Rema 1000 Ballangen",kjede:"REMA_1000",adresse:"Sentrumsveien 65",sted:"Ballangen",lat:68.343215,lng:16.829906},
  {id:"rema_19",navn:"Rema 1000 Nordkjosbotn",kjede:"REMA_1000",adresse:"Sentrumsveien 4",sted:"Nordkjosbotn",lat:69.215976,lng:19.555157},
  {id:"rema_20",navn:"Rema 1000 Tverlandet",kjede:"REMA_1000",adresse:"Grøttingen 1",sted:"Tverlandet",lat:67.296713,lng:14.745347},
  {id:"rema_21",navn:"Rema 1000 Strandvegen",kjede:"REMA_1000",adresse:"Strandvegen 106",sted:"Tromsø",lat:69.635310,lng:18.934551},
  {id:"rema_22",navn:"Rema 1000 Lørenveien",kjede:"REMA_1000",adresse:"Lørenveien 36 A",sted:"Oslo",lat:59.931721,lng:10.789368},
  {id:"rema_23",navn:"Rema 1000 Billingstadsletta",kjede:"REMA_1000",adresse:"Billingstadsletta 11",sted:"Billingstad",lat:59.876782,lng:10.499834},
  {id:"rema_24",navn:"Rema 1000 Sørumsand",kjede:"REMA_1000",adresse:"Tverrveien 2",sted:"Sørumsand",lat:59.987364,lng:11.246024},
  {id:"rema_25",navn:"Rema 1000 Surnadal",kjede:"REMA_1000",adresse:"Øravegen 4",sted:"Surnadal",lat:62.970025,lng:8.712880},
  {id:"rema_26",navn:"Rema 1000 Flekkefjord",kjede:"REMA_1000",adresse:"Lasta 2",sted:"Flekkefjord",lat:58.294255,lng:6.664609},
  {id:"rema_27",navn:"Rema 1000 Lyngåsen",kjede:"REMA_1000",adresse:"Novikveien 113B",sted:"Sandnessjøen",lat:66.007788,lng:12.578041},
  {id:"rema_28",navn:"Rema 1000 Stormyra",kjede:"REMA_1000",adresse:"Gamle Riksvei 7",sted:"Bodø",lat:67.282256,lng:14.413726},
  {id:"rema_29",navn:"Rema 1000 Moan",kjede:"REMA_1000",adresse:"Moafjæra 16",sted:"Levanger",lat:63.733504,lng:11.283830},
  {id:"rema_30",navn:"Rema 1000 Ranenget",kjede:"REMA_1000",adresse:"Ranenget 25 A",sted:"Mo i Rana",lat:66.322070,lng:14.167284},
  {id:"rema_31",navn:"Rema 1000 Innhavet",kjede:"REMA_1000",adresse:"Hamarøyveien 306",sted:"Innhavet",lat:67.963225,lng:15.928186},
  {id:"rema_32",navn:"Rema 1000 Husbyfaret",kjede:"REMA_1000",adresse:"Husbyfaret 4",sted:"Stjørdal",lat:63.469118,lng:10.942966},
  {id:"rema_33",navn:"Rema 1000 Bakklandet",kjede:"REMA_1000",adresse:"Nedre Bakklandet 56",sted:"Trondheim",lat:63.431326,lng:10.406571},
  {id:"rema_34",navn:"Rema 1000 Mogata",kjede:"REMA_1000",adresse:"Kristiansands gate 12C",sted:"Oslo",lat:59.939050,lng:10.753390},
  {id:"rema_35",navn:"Rema 1000 Randaberg",kjede:"REMA_1000",adresse:"Randabergveien 310",sted:"Randaberg",lat:58.992169,lng:5.642413},
  {id:"rema_36",navn:"Rema 1000 Vennesla",kjede:"REMA_1000",adresse:"Lundevegen 47A",sted:"Vennesla",lat:58.250709,lng:7.964439},
  {id:"rema_37",navn:"Rema 1000 Pirsenteret",kjede:"REMA_1000",adresse:"Havnegata 7",sted:"Trondheim",lat:63.440468,lng:10.403959},
  {id:"rema_38",navn:"Rema 1000 Elveneset",kjede:"REMA_1000",adresse:"Elvenesvegen 18",sted:"Nesttun",lat:60.307903,lng:5.369672},
  {id:"rema_39",navn:"Rema 1000 Møllenberg",kjede:"REMA_1000",adresse:"Rosenborg gate 1",sted:"Trondheim",lat:63.434241,lng:10.414850},
  {id:"rema_40",navn:"Rema 1000 Marken",kjede:"REMA_1000",adresse:"Marken 34",sted:"Bergen",lat:60.391129,lng:5.331912},
  {id:"rema_41",navn:"Rema 1000 Melhus Torg",kjede:"REMA_1000",adresse:"Per Bortens veg 3",sted:"Melhus",lat:63.285553,lng:10.280222},
  {id:"rema_42",navn:"Rema 1000 Bjugn",kjede:"REMA_1000",adresse:"Emil Schanches gate 3",sted:"Bjugn",lat:63.763557,lng:9.805161},
  {id:"rema_43",navn:"Rema 1000 Brennåsen",kjede:"REMA_1000",adresse:"Brennåsemoen 1",sted:"Brennåsen",lat:58.138580,lng:7.856036},
  {id:"rema_44",navn:"Rema 1000 Grua",kjede:"REMA_1000",adresse:"Hadelandsvegen 1497",sted:"Grua",lat:60.251020,lng:10.675021},
  {id:"rema_45",navn:"Rema 1000 Charlottenlund",kjede:"REMA_1000",adresse:"Jakobslivegen 59A",sted:"Trondheim",lat:63.420481,lng:10.494628},
  {id:"rema_46",navn:"Rema 1000 Kilamyra",kjede:"REMA_1000",adresse:"Kilamyra 2",sted:"Harstad",lat:68.740145,lng:16.563269},
  {id:"rema_47",navn:"Rema 1000 Majorstua",kjede:"REMA_1000",adresse:"Sørkedalsveien 1A",sted:"Oslo",lat:59.929796,lng:10.713673},
  {id:"rema_48",navn:"Rema 1000 Melbu",kjede:"REMA_1000",adresse:"Neptunveien 2",sted:"Melbu",lat:68.501381,lng:14.814028},
  {id:"rema_49",navn:"Rema 1000 Morvik",kjede:"REMA_1000",adresse:"Slettevikvegen 1",sted:"Morvik",lat:60.474311,lng:5.265761},
  {id:"rema_50",navn:"Rema 1000 Ridabu",kjede:"REMA_1000",adresse:"Kappvegen 1",sted:"Ridabu",lat:60.805995,lng:11.147526},
  {id:"rema_51",navn:"Rema 1000 Rombaksveien",kjede:"REMA_1000",adresse:"Rombaksveien 45",sted:"Narvik",lat:68.445106,lng:17.451562},
  {id:"rema_52",navn:"Rema 1000 Rørvik",kjede:"REMA_1000",adresse:"Havnegata 7E",sted:"Rørvik",lat:64.858950,lng:11.231733},
  {id:"rema_53",navn:"Rema 1000 Skinsnes",kjede:"REMA_1000",adresse:"Sommerkroveien 4",sted:"Mandal",lat:58.027099,lng:7.475285},
  {id:"rema_54",navn:"Rema 1000 Sogn",kjede:"REMA_1000",adresse:"Rolf E Stenersens allé 26A",sted:"Oslo",lat:59.953266,lng:10.729308},
  {id:"rema_55",navn:"Rema 1000 Stange",kjede:"REMA_1000",adresse:"Romedalsvegen 20",sted:"Stange",lat:60.721026,lng:11.197942},
  {id:"rema_56",navn:"Rema 1000 Stryn",kjede:"REMA_1000",adresse:"Tonningsgata 4",sted:"Stryn",lat:61.903388,lng:6.718593},
  {id:"rema_57",navn:"Rema 1000 Torggata",kjede:"REMA_1000",adresse:"Torggata 2",sted:"Oslo",lat:59.913749,lng:10.747143},
  {id:"rema_58",navn:"Rema 1000 Trelastgården",kjede:"REMA_1000",adresse:"Platous gate 33",sted:"Oslo",lat:59.910489,lng:10.764552},
  {id:"rema_59",navn:"Rema 1000 Ågotnes",kjede:"REMA_1000",adresse:"Skjærgårdsvegen 1384",sted:"Ågotnes",lat:60.403667,lng:5.000933},
  {id:"rema_60",navn:"Rema 1000 Båtsfjord",kjede:"REMA_1000",adresse:"Skogholmvegen 4",sted:"Båtsfjord",lat:70.631264,lng:29.712593},
  {id:"rema_61",navn:"Rema 1000 Vækerøveien",kjede:"REMA_1000",adresse:"Vækerøveien 114 D",sted:"Oslo",lat:59.935184,lng:10.638273},
  {id:"rema_62",navn:"Rema 1000 Bispehaugen",kjede:"REMA_1000",adresse:"Aslak Boltsgate 40a",sted:"Hamar",lat:60.797185,lng:11.051059},
  {id:"rema_63",navn:"Rema 1000 Solsiden",kjede:"REMA_1000",adresse:"Dyre Halses gate 1A",sted:"Trondheim",lat:63.436466,lng:10.416530},
  {id:"rema_64",navn:"Rema 1000 Sveberg",kjede:"REMA_1000",adresse:"Svebergvegen 3",sted:"Hommelvik",lat:63.420646,lng:10.755016},
  {id:"rema_65",navn:"Rema 1000 Frøya",kjede:"REMA_1000",adresse:"Sørveien 17 B",sted:"Sistranda",lat:63.728777,lng:8.828133},
  {id:"rema_66",navn:"Rema 1000 Byporten",kjede:"REMA_1000",adresse:"Terminalveien 5",sted:"Mo i Rana",lat:66.306597,lng:14.128499},
  {id:"rema_67",navn:"Rema 1000 Gjelleråsen",kjede:"REMA_1000",adresse:"Carl Bergersens vei 3",sted:"Hagan",lat:59.984666,lng:10.928201},
  {id:"rema_68",navn:"Rema 1000 Skiptvet",kjede:"REMA_1000",adresse:"Storveien 7",sted:"Skiptvet",lat:59.472885,lng:11.163330},
  {id:"rema_69",navn:"Rema 1000 Håland",kjede:"REMA_1000",adresse:"Hognestadvegen 90",sted:"Bryne",lat:58.721229,lng:5.654861},
  {id:"rema_70",navn:"Rema 1000 Kanalveien",kjede:"REMA_1000",adresse:"Kanalveien 1",sted:"Lillestrøm",lat:59.952013,lng:11.045441},
  {id:"rema_71",navn:"Rema 1000 Alti Verdal",kjede:"REMA_1000",adresse:"Magnus den godes veg 23",sted:"Verdal",lat:63.781954,lng:11.470772},
  {id:"rema_72",navn:"Rema 1000 Fitjar",kjede:"REMA_1000",adresse:"Fitjarsjøen 73",sted:"Fitjar",lat:59.919883,lng:5.327397},
  {id:"rema_73",navn:"Rema 1000 Bergseng",kjede:"REMA_1000",adresse:"Bergsveien 6",sted:"Harstad",lat:68.812858,lng:16.514555},
  {id:"rema_74",navn:"Rema 1000 Bjørndal",kjede:"REMA_1000",adresse:"Slimeveien 6A",sted:"Oslo",lat:59.832599,lng:10.838592},
  {id:"rema_75",navn:"Rema 1000 Rena",kjede:"REMA_1000",adresse:"Trudvanggata 15",sted:"Rena",lat:61.131444,lng:11.368452},
  {id:"rema_76",navn:"Rema 1000 Hovenga",kjede:"REMA_1000",adresse:"Augestadvegen 1",sted:"Porsgrunn",lat:59.148799,lng:9.662622},
  {id:"rema_77",navn:"Rema 1000 Froland",kjede:"REMA_1000",adresse:"Osedalen",sted:"Froland",lat:58.507478,lng:8.630457},
  {id:"rema_78",navn:"Rema 1000 Røros",kjede:"REMA_1000",adresse:"Falunveien 9",sted:"Røros",lat:62.574476,lng:11.397124},
  {id:"rema_79",navn:"Rema 1000 Årstaddalen",kjede:"REMA_1000",adresse:"Gamle Sokndalsveien 53",sted:"Egersund",lat:58.438431,lng:6.008597},
  {id:"rema_80",navn:"Rema 1000 Averøy",kjede:"REMA_1000",adresse:"Næringsveien 18",sted:"Averøy",lat:63.067903,lng:7.646458},
  {id:"rema_81",navn:"Rema 1000 Landås",kjede:"REMA_1000",adresse:"Nattlandsveien 84",sted:"Bergen",lat:60.357943,lng:5.368618},
  {id:"rema_82",navn:"Rema 1000 Fredensborgveien",kjede:"REMA_1000",adresse:"Fredensborgveien 24b",sted:"Oslo",lat:59.919201,lng:10.747055},
  {id:"rema_83",navn:"Rema 1000 Årdalstangen",kjede:"REMA_1000",adresse:"Tangevegen 5",sted:"Årdalstangen",lat:61.239226,lng:7.711633},
  {id:"rema_84",navn:"Rema 1000 Veldrebakken",kjede:"REMA_1000",adresse:"Ulfsbakveien 2",sted:"Larvik",lat:59.047477,lng:9.996604},
  {id:"rema_85",navn:"Rema 1000 Vollen",kjede:"REMA_1000",adresse:"Arnestadveien 1C",sted:"Vollen",lat:59.806978,lng:10.486770},
  {id:"rema_86",navn:"Rema 1000 Sørreisa",kjede:"REMA_1000",adresse:"Larsegårdveien 10",sted:"Sørreisa",lat:69.145177,lng:18.155935},
  {id:"rema_87",navn:"Rema 1000 Rosenhoff",kjede:"REMA_1000",adresse:"Olaf Schousvei 2",sted:"Oslo",lat:59.929754,lng:10.780279},
  {id:"rema_88",navn:"Rema 1000 Stadion",kjede:"REMA_1000",adresse:"Stadion 33",sted:"Kråkerøy",lat:59.213492,lng:10.927205},
  {id:"rema_89",navn:"Rema 1000 Opstadveien",kjede:"REMA_1000",adresse:"Opstadveien 2",sted:"Ålgård",lat:58.778580,lng:5.833033},
  {id:"rema_90",navn:"Rema 1000 Frydenlund",kjede:"REMA_1000",adresse:"Frydenlundgata 2",sted:"Narvik",lat:68.438605,lng:17.417217},
  {id:"rema_91",navn:"Rema 1000 Åmot",kjede:"REMA_1000",adresse:"Lilleåsgata 2A",sted:"Åmot",lat:59.892672,lng:9.926028},
  {id:"rema_92",navn:"Rema 1000 Son",kjede:"REMA_1000",adresse:"Gartnerveien 3",sted:"Son",lat:59.493855,lng:10.690737},
  {id:"rema_93",navn:"Rema 1000 Heistad",kjede:"REMA_1000",adresse:"Pansvei 2",sted:"Porsgrunn",lat:59.075975,lng:9.684154},
  {id:"rema_94",navn:"Rema 1000 Garnesveien",kjede:"REMA_1000",adresse:"Garnesvegen 7",sted:"Indre Arna",lat:60.428570,lng:5.469521},
  {id:"rema_95",navn:"Rema 1000 Lade Arena",kjede:"REMA_1000",adresse:"Haakon VII gate 8-10",sted:"Trondheim",lat:63.441738,lng:10.458264},
  {id:"rema_96",navn:"Rema 1000 Storo",kjede:"REMA_1000",adresse:"Sandakerveien 78",sted:"Oslo",lat:59.943703,lng:10.770937},
  {id:"rema_97",navn:"Rema 1000 Tinnheia",kjede:"REMA_1000",adresse:"Tinnheiveien 20",sted:"Kristiansand",lat:58.146843,lng:7.956629},
  {id:"rema_98",navn:"Rema 1000 Skaarlia",kjede:"REMA_1000",adresse:"Skaarlia 1",sted:"Sandnes",lat:58.841837,lng:5.765649},
  {id:"rema_99",navn:"Rema 1000 Strømmen Storsenter",kjede:"REMA_1000",adresse:"Støperiveien 5",sted:"Strømmen",lat:59.947286,lng:11.007331},
  {id:"rema_100",navn:"Rema 1000 Nedenes",kjede:"REMA_1000",adresse:"Vesterveien 737",sted:"Nedenes",lat:58.417459,lng:8.700404},
  {id:"rema_101",navn:"Rema 1000 Sogningen",kjede:"REMA_1000",adresse:"Hovevegen 6",sted:"Sogndal",lat:61.232166,lng:7.103653},
  {id:"rema_102",navn:"Rema 1000 Gimsøy",kjede:"REMA_1000",adresse:"Porsgrunnsvegen 5",sted:"Skien",lat:59.191762,lng:9.611108},
  {id:"rema_103",navn:"Rema 1000 Gjøvik Stadion",kjede:"REMA_1000",adresse:"Marcus Thranes gate 8",sted:"Gjøvik",lat:60.798987,lng:10.684472},
  {id:"rema_104",navn:"Rema 1000 Ellingsrud",kjede:"REMA_1000",adresse:"Skansen Terrasse 2",sted:"Oslo",lat:59.938556,lng:10.907894},
  {id:"rema_105",navn:"Rema 1000 Nidarvoll",kjede:"REMA_1000",adresse:"Sluppenvegen 2",sted:"Trondheim",lat:63.399131,lng:10.403001},
  {id:"rema_106",navn:"Rema 1000 Toppen",kjede:"REMA_1000",adresse:"Hvittingfossveien 131",sted:"Holmestrand",lat:59.490759,lng:10.293734},
  {id:"rema_107",navn:"Rema 1000 Vestby Storsenter",kjede:"REMA_1000",adresse:"Senterveien 6",sted:"Vestby",lat:59.603221,lng:10.742192},
  {id:"rema_108",navn:"Rema 1000 Treschowsgate",kjede:"REMA_1000",adresse:"Treschows gate 19B",sted:"Oslo",lat:59.938976,lng:10.762347},
  {id:"rema_109",navn:"Rema 1000 Evje",kjede:"REMA_1000",adresse:"Verksvegen 12",sted:"Evje",lat:58.583273,lng:7.797168},
  {id:"rema_110",navn:"Rema 1000 Sandstuveien",kjede:"REMA_1000",adresse:"Sandstuveien 60A",sted:"Oslo",lat:59.887705,lng:10.805531},
  {id:"rema_111",navn:"Rema 1000 Metro Senter",kjede:"REMA_1000",adresse:"Kulturhusgata 2",sted:"Lørenskog",lat:59.927111,lng:10.962492},
  {id:"rema_112",navn:"Rema 1000 Torshovdalen",kjede:"REMA_1000",adresse:"Hans Nielsen Hauges gate 37E",sted:"Oslo",lat:59.938362,lng:10.780829},
  {id:"rema_113",navn:"Rema 1000 Kroppanmarka",kjede:"REMA_1000",adresse:"Okstadvegen 1",sted:"Tiller",lat:63.382759,lng:10.377629},
  {id:"rema_114",navn:"Rema 1000 Østerøyveien",kjede:"REMA_1000",adresse:"Østerøyveien 2",sted:"Sandefjord",lat:59.134202,lng:10.251474},
  {id:"rema_115",navn:"Rema 1000 Skullerud",kjede:"REMA_1000",adresse:"Johan Scharffenbergs vei 75A",sted:"Oslo",lat:59.867834,lng:10.839508},
  {id:"rema_116",navn:"Rema 1000 Bertnes",kjede:"REMA_1000",adresse:"Fenesveien 10",sted:"Bodø",lat:67.287273,lng:14.592006},
  {id:"rema_117",navn:"Rema 1000 Ryensvingen",kjede:"REMA_1000",adresse:"Ryensvingen 5-7",sted:"Oslo",lat:59.892746,lng:10.804877},
  {id:"rema_118",navn:"Rema 1000 Sannidal",kjede:"REMA_1000",adresse:"Tangen 11",sted:"Sannidal",lat:58.896119,lng:9.283289},
  {id:"rema_119",navn:"Rema 1000 Oti Senteret",kjede:"REMA_1000",adresse:"Tverradkomsten 60",sted:"Orkanger",lat:63.306092,lng:9.838990},
  {id:"rema_120",navn:"Rema 1000 Silovegen",kjede:"REMA_1000",adresse:"Silovegen 24",sted:"Årnes",lat:60.126018,lng:11.469305},
  {id:"rema_121",navn:"Rema 1000 Rønvik",kjede:"REMA_1000",adresse:"Jernbaneveien 33",sted:"Bodø",lat:67.297600,lng:14.402000},
  {id:"rema_122",navn:"Rema 1000 Rådhusplassen",kjede:"REMA_1000",adresse:"Rådhusplassen 35",sted:"Ås",lat:59.664645,lng:10.788453},
  {id:"rema_123",navn:"Rema 1000 Åsane Senter",kjede:"REMA_1000",adresse:"Åsane Senter 51",sted:"Bergen",lat:60.468222,lng:5.325124},
  {id:"rema_124",navn:"Rema 1000 Sandved",kjede:"REMA_1000",adresse:"Jærveien 123",sted:"Sandnes",lat:58.838206,lng:5.721996},
  {id:"rema_125",navn:"Rema 1000 Fjell",kjede:"REMA_1000",adresse:"Fjellavegen 228",sted:"Fjell",lat:60.330770,lng:5.076628},
  {id:"rema_126",navn:"Rema 1000 Årvoll",kjede:"REMA_1000",adresse:"Årvollveien 17",sted:"Oslo",lat:59.944995,lng:10.809127},
  {id:"rema_127",navn:"Rema 1000 Brødløs",kjede:"REMA_1000",adresse:"BRA veien 54",sted:"Halden",lat:59.139241,lng:11.379349},
  {id:"rema_128",navn:"Rema 1000 Vulkan",kjede:"REMA_1000",adresse:"Maridalsveien 15",sted:"Oslo",lat:59.922419,lng:10.750941},
  {id:"rema_129",navn:"Rema 1000 Elgeseter",kjede:"REMA_1000",adresse:"Klæbuveien 68",sted:"Trondheim",lat:63.415492,lng:10.399118},
  {id:"rema_130",navn:"Rema 1000 Inderøy",kjede:"REMA_1000",adresse:"Nessjordet 1",sted:"Inderøy",lat:63.873866,lng:11.297914},
  {id:"rema_131",navn:"Rema 1000 Lystlunden",kjede:"REMA_1000",adresse:"Moloveien 1A",sted:"Horten",lat:59.416812,lng:10.490972},
  {id:"rema_132",navn:"Rema 1000 Digernes",kjede:"REMA_1000",adresse:"Digernes Næringsområde 1",sted:"Skodje",lat:62.493310,lng:6.608266},
  {id:"rema_133",navn:"Rema 1000 Ålgård",kjede:"REMA_1000",adresse:"Sandnesveien 15",sted:"Ålgård",lat:58.767732,lng:5.861238},
  {id:"rema_134",navn:"Rema 1000 Kolbotn",kjede:"REMA_1000",adresse:"Ormerudveien 82",sted:"Kolbotn",lat:59.823296,lng:10.808804},
  {id:"rema_135",navn:"Rema 1000 Fabrikkvegen",kjede:"REMA_1000",adresse:"Fabrikkvegen 3",sted:"Brumunddal",lat:60.887525,lng:10.930450},
  {id:"rema_136",navn:"Rema 1000 Nordsia",kjede:"REMA_1000",adresse:"Bogavegen 5",sted:"Steinkjer",lat:64.018980,lng:11.491518},
  {id:"rema_137",navn:"Rema 1000 Tordenskjoldsgate",kjede:"REMA_1000",adresse:"Kristian IVs gate 5",sted:"Kristiansand",lat:58.146873,lng:7.989458},
  {id:"rema_138",navn:"Rema 1000 Ilsvika",kjede:"REMA_1000",adresse:"Mellomila 75",sted:"Trondheim",lat:63.431480,lng:10.358301},
  {id:"rema_139",navn:"Rema 1000 Bygnes",kjede:"REMA_1000",adresse:"Fotvegen 1A",sted:"Kopervik",lat:59.293136,lng:5.291440},
  {id:"rema_140",navn:"Rema 1000 Skulestadmo",kjede:"REMA_1000",adresse:"Strandavegen 335",sted:"Voss",lat:60.658708,lng:6.437102},
  {id:"rema_141",navn:"Rema 1000 Guldbergaunet",kjede:"REMA_1000",adresse:"Ogndalsveien 49",sted:"Steinkjer",lat:64.017274,lng:11.504995},
  {id:"rema_142",navn:"Rema 1000 Neskollen",kjede:"REMA_1000",adresse:"Melkevegen 2",sted:"Hvam",lat:60.123964,lng:11.339960},
  {id:"rema_143",navn:"Rema 1000 Risum",kjede:"REMA_1000",adresse:"Iddeveien 29",sted:"Halden",lat:59.118682,lng:11.409370},
  {id:"rema_144",navn:"Rema 1000 Krokdalsmyra",kjede:"REMA_1000",adresse:"Terminalveien 7",sted:"Fauske",lat:67.270191,lng:15.395289},
  {id:"rema_145",navn:"Rema 1000 Jessheim",kjede:"REMA_1000",adresse:"Ringveien 4",sted:"Jessheim",lat:60.142971,lng:11.173362},
  {id:"rema_146",navn:"Rema 1000 Stasjonsveien",kjede:"REMA_1000",adresse:"Stasjonsveien 51A",sted:"Oslo",lat:59.948457,lng:10.664869},
  {id:"rema_147",navn:"Rema 1000 Løken",kjede:"REMA_1000",adresse:"Sandumveien 2",sted:"Løken",lat:59.795326,lng:11.464389},
  {id:"rema_148",navn:"Rema 1000 Ottestad",kjede:"REMA_1000",adresse:"Holmlundvegen 1",sted:"Ottestad",lat:60.768861,lng:11.130626},
  {id:"rema_149",navn:"Rema 1000 Skudenes",kjede:"REMA_1000",adresse:"Syrevegen 2",sted:"Skudeneshavn",lat:59.157183,lng:5.236759},
  {id:"rema_150",navn:"Rema 1000 Halmstad",kjede:"REMA_1000",adresse:"Ryggeveien 375A",sted:"Rygge",lat:59.376073,lng:10.758791},
  {id:"rema_151",navn:"Rema 1000 Hoffsveien",kjede:"REMA_1000",adresse:"Hoffsveien 10",sted:"Oslo",lat:59.925744,lng:10.674830},
  {id:"rema_152",navn:"Rema 1000 Mosseporten",kjede:"REMA_1000",adresse:"Patterødveien 2",sted:"Moss",lat:59.446244,lng:10.703235},
  {id:"rema_153",navn:"Rema 1000 Storhamar",kjede:"REMA_1000",adresse:"Kornsilovegen 58",sted:"Hamar",lat:60.801726,lng:11.035147},
  {id:"rema_154",navn:"Rema 1000 Røakrysset",kjede:"REMA_1000",adresse:"Vækerøveien 210",sted:"Oslo",lat:59.947172,lng:10.642618},
  {id:"rema_155",navn:"Rema 1000 Melkeplassen",kjede:"REMA_1000",adresse:"Øvre Fyllingsveien 77",sted:"Laksevåg",lat:60.371350,lng:5.302896},
  {id:"rema_156",navn:"Rema 1000 Begby",kjede:"REMA_1000",adresse:"Haldenveien 6",sted:"Fredrikstad",lat:59.208300,lng:10.990890},
  {id:"rema_157",navn:"Rema 1000 Olsrød Park",kjede:"REMA_1000",adresse:"Gauterødveien 6B",sted:"Tønsberg",lat:59.275104,lng:10.451185},
  {id:"rema_158",navn:"Rema 1000 Parkveien",kjede:"REMA_1000",adresse:"Parkveien 21",sted:"Oslo",lat:59.921245,lng:10.728970},
  {id:"rema_159",navn:"Rema 1000 Vinterbro",kjede:"REMA_1000",adresse:"Sjøskogenveien 7",sted:"Vinterbro",lat:59.739540,lng:10.770839},
  {id:"rema_160",navn:"Rema 1000 Nannestad",kjede:"REMA_1000",adresse:"Ekervegen 2A",sted:"Nannestad",lat:60.220385,lng:11.015062},
  {id:"rema_161",navn:"Rema 1000 Lijordet",kjede:"REMA_1000",adresse:"Nordveien 43A",sted:"Eiksmarka",lat:59.936828,lng:10.608173},
  {id:"rema_162",navn:"Rema 1000 Oseberg",kjede:"REMA_1000",adresse:"Storgaten 2B",sted:"Tønsberg",lat:59.263420,lng:10.414171},
  {id:"rema_163",navn:"Rema 1000 Sem",kjede:"REMA_1000",adresse:"Døvleveien 5",sted:"Sem",lat:59.283095,lng:10.333390},
  {id:"rema_164",navn:"Rema 1000 Vingrom",kjede:"REMA_1000",adresse:"Torpavegen 2",sted:"Vingrom",lat:61.046945,lng:10.433418},
  {id:"rema_165",navn:"Rema 1000 Bøler",kjede:"REMA_1000",adresse:"Bølerlia 52",sted:"Oslo",lat:59.879616,lng:10.852432},
  {id:"rema_166",navn:"Rema 1000 Bærums Verk",kjede:"REMA_1000",adresse:"Elvegangen 7",sted:"Bærums Verk",lat:59.942452,lng:10.501191},
  {id:"rema_167",navn:"Rema 1000 Hommelvik",kjede:"REMA_1000",adresse:"Havnevegen 20",sted:"Hommelvik",lat:63.416478,lng:10.810015},
  {id:"rema_168",navn:"Rema 1000 Geilo",kjede:"REMA_1000",adresse:"Kyrkjevegen 2",sted:"Geilo",lat:60.534151,lng:8.208093},
  {id:"rema_169",navn:"Rema 1000 Brokelandsheia",kjede:"REMA_1000",adresse:"Brokelandsheia øst 1",sted:"Sundebru",lat:58.821144,lng:9.078608},
  {id:"rema_170",navn:"Rema 1000 Røyslimoen",kjede:"REMA_1000",adresse:"Røyslivegen 1",sted:"Lillehammer",lat:61.099018,lng:10.506871},
  {id:"rema_171",navn:"Rema 1000 Hellerud",kjede:"REMA_1000",adresse:"Tvetenveien 170",sted:"Oslo",lat:59.916392,lng:10.848500},
  {id:"rema_172",navn:"Rema 1000 Ringebu",kjede:"REMA_1000",adresse:"Brugata 9",sted:"Ringebu",lat:61.530394,lng:10.144585},
  {id:"rema_173",navn:"Rema 1000 Ålingen",kjede:"REMA_1000",adresse:"Myren 19",sted:"Ål",lat:60.630898,lng:8.564312},
  {id:"rema_174",navn:"Rema 1000 Gjettum",kjede:"REMA_1000",adresse:"Bærumsveien 377",sted:"Gjettum",lat:59.908687,lng:10.533792},
  {id:"rema_175",navn:"Rema 1000 Gran",kjede:"REMA_1000",adresse:"Morstadvegen 1",sted:"Gran",lat:60.352667,lng:10.575522},
  {id:"rema_176",navn:"Rema 1000 Storaberget",kjede:"REMA_1000",adresse:"Binnekroken 1",sted:"Stavanger",lat:58.896093,lng:5.724413},
  {id:"rema_177",navn:"Rema 1000 Tempokrysset",kjede:"REMA_1000",adresse:"Skiringssalveien 9A",sted:"Sandefjord",lat:59.136530,lng:10.214025},
  {id:"rema_178",navn:"Rema 1000 Vanse",kjede:"REMA_1000",adresse:"Oreveien 5",sted:"Vanse",lat:58.098093,lng:6.690790},
  {id:"rema_179",navn:"Rema 1000 Trøgstad",kjede:"REMA_1000",adresse:"Kirkeveien 19",sted:"Trøgstad",lat:59.641906,lng:11.315495},
  {id:"rema_180",navn:"Rema 1000 Lørenskog Stasjonsby",kjede:"REMA_1000",adresse:"Haneborgveien 12",sted:"Lørenskog",lat:59.944186,lng:10.950416},
  {id:"rema_181",navn:"Rema 1000 Linden Park",kjede:"REMA_1000",adresse:"Strandparken 3",sted:"Horten",lat:59.407653,lng:10.484497},
  {id:"rema_182",navn:"Rema 1000 Hovin",kjede:"REMA_1000",adresse:"Hovinveien 43A",sted:"Oslo",lat:59.921464,lng:10.791878},
  {id:"rema_183",navn:"Rema 1000 Varnaveien",kjede:"REMA_1000",adresse:"Varnaveien 30",sted:"Moss",lat:59.417272,lng:10.675844},
  {id:"rema_184",navn:"Rema 1000 Langeland",kjede:"REMA_1000",adresse:"Industrivegen 5",sted:"Kongsvinger",lat:60.202068,lng:11.976355},
  {id:"rema_185",navn:"Rema 1000 Namsos",kjede:"REMA_1000",adresse:"Søren R Thornæs veg 19",sted:"Namsos",lat:64.467456,lng:11.504728},
  {id:"rema_186",navn:"Rema 1000 Åskollen",kjede:"REMA_1000",adresse:"Tverrliggeren 4",sted:"Drammen",lat:59.712791,lng:10.257541},
  {id:"rema_187",navn:"Rema 1000 Kjørbekk",kjede:"REMA_1000",adresse:"Kjørbekkdalen 14",sted:"Skien",lat:59.174244,lng:9.616169},
  {id:"rema_188",navn:"Rema 1000 Terningen",kjede:"REMA_1000",adresse:"Jegerstien 12",sted:"Elverum",lat:60.884233,lng:11.537487},
  {id:"rema_189",navn:"Rema 1000 Skreia",kjede:"REMA_1000",adresse:"Jerikovegen 5",sted:"Skreia",lat:60.654294,lng:10.934721},
  {id:"rema_190",navn:"Rema 1000 Olavsgate",kjede:"REMA_1000",adresse:"Olavs gate 11",sted:"Larvik",lat:59.054227,lng:10.031486},
  {id:"rema_191",navn:"Rema 1000 Borgen",kjede:"REMA_1000",adresse:"Søndre Borgen 13",sted:"Borgen",lat:59.826578,lng:10.422519},
  {id:"rema_192",navn:"Rema 1000 Åros",kjede:"REMA_1000",adresse:"Hurumveien 49",sted:"Åros",lat:59.704682,lng:10.512534},
  {id:"rema_193",navn:"Rema 1000 Viken",kjede:"REMA_1000",adresse:"Damsgårdsveien 35",sted:"Bergen",lat:60.378365,lng:5.328802},
  {id:"rema_194",navn:"Rema 1000 Åssiden",kjede:"REMA_1000",adresse:"Ingeniør Rybergsgate 114",sted:"Drammen",lat:59.755366,lng:10.124932},
  {id:"rema_195",navn:"Rema 1000 Havstein",kjede:"REMA_1000",adresse:"John Skaarvolds veg 40",sted:"Trondheim",lat:63.409076,lng:10.361278},
  {id:"rema_196",navn:"Rema 1000 Fosnavåg",kjede:"REMA_1000",adresse:"Eggesbøjorda 1",sted:"Fosnavåg",lat:62.325016,lng:5.639505},
  {id:"rema_197",navn:"Rema 1000 Vabakkjen",kjede:"REMA_1000",adresse:"Vabakkjen 4A",sted:"Stord",lat:59.773961,lng:5.485773},
  {id:"rema_198",navn:"Rema 1000 Gamleveien",kjede:"REMA_1000",adresse:"Gamleveien 81",sted:"Sandnes",lat:58.883807,lng:5.743580},
  {id:"rema_199",navn:"Rema 1000 Sellebakk",kjede:"REMA_1000",adresse:"Sorgenfri allé 5",sted:"Sellebakk",lat:59.224415,lng:10.988947},
  {id:"rema_200",navn:"Rema 1000 Støren",kjede:"REMA_1000",adresse:"Moøya 34",sted:"Støren",lat:63.042353,lng:10.285891},
  {id:"rema_201",navn:"Rema 1000 Rodeløkka",kjede:"REMA_1000",adresse:"Trondheimsveien 72",sted:"Oslo",lat:59.923431,lng:10.772178},
  {id:"rema_202",navn:"Rema 1000 Søderlundmyra",kjede:"REMA_1000",adresse:"Søderlundmyra 14",sted:"Mo i Rana",lat:66.317765,lng:14.144444},
  {id:"rema_203",navn:"Rema 1000 Sørenga",kjede:"REMA_1000",adresse:"Sørengkaia 11",sted:"Oslo",lat:59.902830,lng:10.754882},
  {id:"rema_204",navn:"Rema 1000 Maura",kjede:"REMA_1000",adresse:"Mauravegen 4",sted:"Maura",lat:60.258501,lng:11.035324},
  {id:"rema_205",navn:"Rema 1000 Brattvåg",kjede:"REMA_1000",adresse:"Synnalandsvegen 51",sted:"Brattvåg",lat:62.605567,lng:6.438064},
  {id:"rema_206",navn:"Rema 1000 Tomasjord",kjede:"REMA_1000",adresse:"Evjenvegen 120",sted:"Tomasjord",lat:69.664783,lng:19.021022},
  {id:"rema_207",navn:"Rema 1000 Korskirkekvartalet",kjede:"REMA_1000",adresse:"Nedre Korskirkeallmenningen 1A",sted:"Bergen",lat:60.394360,lng:5.327411},
  {id:"rema_208",navn:"Rema 1000 Skogen",kjede:"REMA_1000",adresse:"Bøgata 55A",sted:"Bø i Telemark",lat:59.413113,lng:9.064521},
  {id:"rema_209",navn:"Rema 1000 Tingsaker",kjede:"REMA_1000",adresse:"Tingsakerbakken 15",sted:"Lillesand",lat:58.260984,lng:8.392211},
  {id:"rema_210",navn:"Rema 1000 Vigrestad",kjede:"REMA_1000",adresse:"Grønholsveien 5",sted:"Vigrestad",lat:58.571498,lng:5.691202},
  {id:"rema_211",navn:"Rema 1000 Kanebogen",kjede:"REMA_1000",adresse:"Skilleveien 5",sted:"Harstad",lat:68.779309,lng:16.565744},
  {id:"rema_212",navn:"Rema 1000 Vika",kjede:"REMA_1000",adresse:"Parkveien 64",sted:"Oslo",lat:59.914393,lng:10.721695},
  {id:"rema_213",navn:"Rema 1000 Konnerud",kjede:"REMA_1000",adresse:"Jarlsbergveien 3",sted:"Drammen",lat:59.718803,lng:10.145368},
  {id:"rema_214",navn:"Rema 1000 Nesbyen",kjede:"REMA_1000",adresse:"Rukkedalsvegen 45",sted:"Nesbyen",lat:60.568184,lng:9.103530},
  {id:"rema_215",navn:"Rema 1000 Tollboden",kjede:"REMA_1000",adresse:"C. Sundts gate 60",sted:"Bergen",lat:60.398817,lng:5.309707},
  {id:"rema_216",navn:"Rema 1000 Hovseter",kjede:"REMA_1000",adresse:"Hovseterveien 70-72",sted:"Oslo",lat:59.949381,lng:10.653425},
  {id:"rema_217",navn:"Rema 1000 Kalosjegata",kjede:"REMA_1000",adresse:"Kalosjegata 88",sted:"Krokstadelva",lat:59.755895,lng:10.009117},
  {id:"rema_218",navn:"Rema 1000 Siljan",kjede:"REMA_1000",adresse:"Sentrumsveien 40",sted:"Siljan",lat:59.278349,lng:9.726098},
  {id:"rema_219",navn:"Rema 1000 Berkåk",kjede:"REMA_1000",adresse:"Myrveien 6",sted:"Rennebu",lat:62.828828,lng:10.008653},
  {id:"rema_220",navn:"Rema 1000 Lødingen",kjede:"REMA_1000",adresse:"Sjøvegen 52",sted:"Lødingen",lat:68.419835,lng:15.990262},
  {id:"rema_221",navn:"Rema 1000 Råstølen",kjede:"REMA_1000",adresse:"Steinsvikvegen 274",sted:"Rådal",lat:60.301170,lng:5.308614},
  {id:"rema_222",navn:"Rema 1000 Elvegata",kjede:"REMA_1000",adresse:"Elvegata 11",sted:"Sandnes",lat:58.849921,lng:5.738266},
  {id:"rema_223",navn:"Rema 1000 Revetal",kjede:"REMA_1000",adresse:"Regata 9",sted:"Revetal",lat:59.372209,lng:10.263782},
  {id:"rema_224",navn:"Rema 1000 Hunstad",kjede:"REMA_1000",adresse:"Hunstadsentret 9",sted:"Bodø",lat:67.280953,lng:14.544750},
  {id:"rema_225",navn:"Rema 1000 Breidablikk",kjede:"REMA_1000",adresse:"Industriveien 13",sted:"Heimdal",lat:63.349952,lng:10.359564},
  {id:"rema_226",navn:"Rema 1000 Øyrane",kjede:"REMA_1000",adresse:"Firdavegen 20",sted:"Førde",lat:61.457519,lng:5.848443},
  {id:"rema_227",navn:"Rema 1000 Veitvet",kjede:"REMA_1000",adresse:"Veitvetveien 8",sted:"Oslo",lat:59.944354,lng:10.847902},
  {id:"rema_228",navn:"Rema 1000 Falkum",kjede:"REMA_1000",adresse:"Odds plass 1",sted:"Skien",lat:59.212217,lng:9.590599},
  {id:"rema_229",navn:"Rema 1000 Grorud",kjede:"REMA_1000",adresse:"Romsåsveien 4",sted:"Oslo",lat:59.961026,lng:10.884187},
  {id:"rema_230",navn:"Rema 1000 Lars Hilles Gate",kjede:"REMA_1000",adresse:"Lars Hilles gate 19",sted:"Bergen",lat:60.387117,lng:5.331501},
  {id:"rema_231",navn:"Rema 1000 Skogveien",kjede:"REMA_1000",adresse:"Skogveien 6",sted:"Rakkestad",lat:59.426740,lng:11.343593},
  {id:"rema_232",navn:"Rema 1000 Minde",kjede:"REMA_1000",adresse:"Kanalveien 5",sted:"Bergen",lat:60.369968,lng:5.341864},
  {id:"rema_233",navn:"Rema 1000 Sæterkrysset",kjede:"REMA_1000",adresse:"Nordstrandveien 47",sted:"Oslo",lat:59.860485,lng:10.801451},
  {id:"rema_234",navn:"Rema 1000 Tollnes",kjede:"REMA_1000",adresse:"Leirvollen 6",sted:"Skien",lat:59.164682,lng:9.635172},
  {id:"rema_235",navn:"Rema 1000 Grong",kjede:"REMA_1000",adresse:"Sundspetvegen 35",sted:"Grong",lat:64.463844,lng:12.304657},
  {id:"rema_236",navn:"Rema 1000 Sagvåg",kjede:"REMA_1000",adresse:"Sagvågsvegen 501",sted:"Sagvåg",lat:59.777435,lng:5.395160},
  {id:"rema_237",navn:"Rema 1000 Stoa",kjede:"REMA_1000",adresse:"Sagvannsveien 16",sted:"Arendal",lat:58.464842,lng:8.710840},
  {id:"rema_238",navn:"Rema 1000 Ormåsen",kjede:"REMA_1000",adresse:"Ormåsen",sted:"Vestfossen",lat:59.753887,lng:9.822736},
  {id:"rema_239",navn:"Rema 1000 Christian Krohgsgate",kjede:"REMA_1000",adresse:"Christian Krohgs gate 1",sted:"Oslo",lat:59.914060,lng:10.756687},
  {id:"rema_240",navn:"Rema 1000 Mongstad",kjede:"REMA_1000",adresse:"Mongstadvegen 1050",sted:"Mongstad",lat:60.797019,lng:5.009883},
  {id:"rema_241",navn:"Rema 1000 Søreide",kjede:"REMA_1000",adresse:"Dolvikbakken 4",sted:"Søreidgrend",lat:60.306073,lng:5.269011},
  {id:"rema_242",navn:"Rema 1000 Lillo",kjede:"REMA_1000",adresse:"Betzy Kjelsbergs vei 9",sted:"Oslo",lat:59.953117,lng:10.774162},
  {id:"rema_243",navn:"Rema 1000 Brynseng",kjede:"REMA_1000",adresse:"Østensjøveien 43",sted:"Oslo",lat:59.909747,lng:10.813047},
  {id:"rema_244",navn:"Rema 1000 Brumunddal",kjede:"REMA_1000",adresse:"Nils Amblis veg 4",sted:"Brumunddal",lat:60.882325,lng:10.936875},
  {id:"rema_245",navn:"Rema 1000 Skarnes",kjede:"REMA_1000",adresse:"Øgardsvegen 3",sted:"Skarnes",lat:60.254208,lng:11.683367},
  {id:"rema_246",navn:"Rema 1000 Torsbudalen",kjede:"REMA_1000",adresse:"Torsbuåsen 2",sted:"Arendal",lat:58.481225,lng:8.756155},
];
// Erstatt hardkodede Rema-butikker med de ekte
(()=>{ const uten=SEED_BUTIKKER.filter(b=>b.kjede!=="REMA_1000"); SEED_BUTIKKER.length=0; SEED_BUTIKKER.push(...uten,...REMA_BUTIKKER); })();

/* ════ KASSALAPP API-INTEGRASJON ════ */
const PROXY_URL = "https://matpilot-api.vercel.app";

// Cache: vareId → { ean, priser: { KIWI: 29.9, REMA_1000: 27.9, ... } }
let G_EAN_CACHE = {};

// Last EAN-cache fra storage
async function lastEanCache(){
  try{
    const r = await window.storage.get("matpilot-ean-cache");
    if(r) G_EAN_CACHE = JSON.parse(r.value);
  } catch(e){ G_EAN_CACHE = {}; }
}

// Lagre EAN-cache til storage
async function lagreEanCache(){
  try{ await window.storage.set("matpilot-ean-cache", JSON.stringify(G_EAN_CACHE)); }
  catch(e){ console.warn("Kunne ikke lagre EAN-cache:", e.message); }
}

// Søk opp EAN for én vare via proxyen
async function sokEan(vare){
  try{
    const sokeord = encodeURIComponent(${vare.navn.split(" ").slice(0,3).join(" ")});
    const r = await fetch(${PROXY_URL}/api/products?search=${sokeord}&size=5&unique=true);
    if(!r.ok) return null;
    const d = await r.json();
    // Finn beste treff: produkt der navn eller produsent matcher
    const prod = vare.prod.toLowerCase();
    const navn = vare.navn.toLowerCase();
    const treff = (d.produkter||[]).find(p=>{
      const pn = (p.navn||"").toLowerCase();
      const pp = (p.prod||"").toLowerCase();
      return pp.includes(prod) || prod.includes(pp) || pn.includes(navn.split(" ")[0]);
    }) || d.produkter?.[0];
    return treff?.ean || null;
  } catch(e){ return null; }
}

// Hent ekte priser for en liste med EANs via proxyen
async function hentEktePriser(eans){
  if(!eans.length) return {};
  try{
    const r = await fetch(${PROXY_URL}/api/prices-bulk, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({eans})
    });
    if(!r.ok) return {};
    const d = await r.json();
    return d.priser || {};
  } catch(e){ return {}; }
}

// Hent ekte butikker fra proxyen
async function lastEkteButikker(){
  try{
    // Hent første side for å finne totalt antall sider
    const r1 = await fetch(${PROXY_URL}/api/stores?size=100&page=1);
    if(!r1.ok) throw new Error("HTTP "+r1.status);
    const d1 = await r1.json();
    const sisteSide = Math.min(d1.meta?.last_page || 1, 60);
    const alle = [...(d1.butikker||[])];

    // Hent resten parallelt i bolker på 10 sider om gangen
    for(let start=2; start<=sisteSide; start+=10){
      const slutt = Math.min(start+9, sisteSide);
      const sider = Array.from({length:slutt-start+1},(_,i)=>start+i);
      const res = await Promise.allSettled(
        sider.map(s=>fetch(${PROXY_URL}/api/stores?size=100&page=${s}).then(r=>r.ok?r.json():null))
      );
      for(const r of res){
        if(r.status==="fulfilled" && r.value?.butikker) alle.push(...r.value.butikker);
      }
    }
    return alle;
  } catch(e){
    console.warn("Kunne ikke laste butikker:", e.message);
    return [];
  }
}

// Oppdater EAN-cache for alle varer (kjøres i bakgrunnen, 1 vare om gangen for å unngå rate-limit)
async function oppdaterEanCache(varer, onOppdatert){
  const mangler = varer.filter(v=>!G_EAN_CACHE[v.id]?.ean);

  // Søk opp EAN for maks 20 varer per kjøring (resten neste gang)
  const batch = mangler.slice(0, 20);
  for(const vare of batch){
    const ean = await sokEan(vare);
    if(ean) G_EAN_CACHE[vare.id] = { ean, priser:{}, sistOppdatert: 0 };
    await new Promise(r=>setTimeout(r, 300)); // 300ms pause mellom kall
  }

  // Hent priser for alle varer med EAN som ikke er oppdatert siste time
  const trengerPris = Object.entries(G_EAN_CACHE)
    .filter(([,v])=>v.ean && Date.now()-v.sistOppdatert > 3600000)
    .map(([id,v])=>({id, ean:v.ean}));

  if(trengerPris.length){
    const eans = trengerPris.map(x=>x.ean);
    const priser = await hentEktePriser(eans);
    for(const {id, ean} of trengerPris){
      if(priser[ean]){
        G_EAN_CACHE[id] = { ean, priser: priser[ean], sistOppdatert: Date.now() };
      }
    }
  }

  await lagreEanCache();
  if(onOppdatert) onOppdatert(); // varsle UI om at ekte priser er klare
}
const VARER_BASIS = VARER.slice();
const BUTIKKER_BASIS = SEED_BUTIKKER.slice();
let G_RAPPORTER = [], G_BEKREFT = [], G_ADMIN = {};
function settPrisData(rapporter, bekreftelser, adminPriser){ G_RAPPORTER = rapporter; G_BEKREFT = bekreftelser; G_ADMIN = adminPriser||{}; }
function settKatalog(ekstraVarer, ekstraButikker, fjernedeVarer, fjernedeButikker, bilder){
  VARER.length = 0;
  VARER.push(
    ...VARER_BASIS.filter(v=>!fjernedeVarer.includes(v.id)).map(v=>bilder[v.id]?{...v,bilde:bilder[v.id]}:v),
    ...ekstraVarer.filter(v=>!fjernedeVarer.includes(v.id)).map(v=>bilder[v.id]?{...v,bilde:bilder[v.id]}:v)
  );
  SEED_BUTIKKER.length = 0;
  SEED_BUTIKKER.push(...BUTIKKER_BASIS.filter(b=>!fjernedeButikker.includes(b.id)), ...ekstraButikker);
}
function finnDuplikatButikker(navn, adresse){
  const n=(navn||"").toLowerCase().trim(), a=(adresse||"").toLowerCase().trim();
  if(!n) return [];
  return SEED_BUTIKKER.filter(b=>{
    const bn=b.navn.toLowerCase(), ba=(b.adresse||"").toLowerCase();
    return bn.includes(n)||n.includes(bn)||(a&&ba&&ba===a);
  });
}
function hash(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }
function erBekreftet(vareId, butikkId){ return G_BEKREFT.some(b=>b.vareId===vareId && b.butikkId===butikkId); }
function butikkPris(vareId, butikkId){
  // 0) Adminpriser har høyest prioritet
  const ap = G_ADMIN[vareId+"|"+butikkId];
  if(ap){
    if(ap.slettet) return null;
    return { pris:ap.pris, status:"verifisert", tilbud:false, kilde:"admin", tid:ap.tid||naa() };
  }
  // 1) Ekte pris fra Kassalapp via EAN-cache (per kjede)
  const butikk = SEED_BUTIKKER.find(x=>x.id===butikkId);
  const ektePriser = G_EAN_CACHE[vareId]?.priser;
  if(butikk && ektePriser && KASSALAPP_KJEDER.has(butikk.kjede)){
    const ektePris = ektePriser[butikk.kjede];
    if(ektePris){
      return { pris:Math.round(ektePris*100)/100, status:"verifisert", tilbud:false, kilde:"kassalapp", tid:G_EAN_CACHE[vareId]?.sistOppdatert||0 };
    }
  }
  // 2) Nyeste brukerrapport
  const r = G_RAPPORTER.filter(x=>x.vareId===vareId && x.butikkId===butikkId).sort((a,b)=>b.tid-a.tid)[0];
  if(r){
    return { pris:r.pris, status:r.status==="verifisert"?"verifisert":"rapport", tilbud:false, kilde:"rapport", tid:r.tid };
  }
  // 3) Simulert basispris (alltid "utdatert" siden det ikke er en ekte kilde)
  const b = SEED_BUTIKKER.find(x=>x.id===butikkId), basis = BASIS[vareId];
  if(!b || basis==null) return null;
  const h = hash(vareId+"|"+butikkId);
  if(h%100 < 10) return null;
  let pris = basis * (KJEDEFAKTOR[b.kjede]||1) * (1 + ((h%9)-4)/200);
  const tilbud = h%100 >= 90;
  if(tilbud) pris *= 0.78;
  return { pris:Math.round(pris*10)/10, status:"simulert", tilbud, kilde:"simulert", tid:0 };
}
function snitt(arr){ return Math.round(arr.reduce((a,x)=>a+x.pris,0)/arr.length*10)/10; }
function prisMedFallback(vareId, butikkId){
  const direkte = butikkPris(vareId, butikkId);
  if(direkte) return direkte;
  const b = SEED_BUTIKKER.find(x=>x.id===butikkId);
  if(!b || BASIS[vareId]==null) return null;
  const kjede = SEED_BUTIKKER.filter(x=>x.kjede===b.kjede && x.id!==butikkId)
    .map(x=>butikkPris(vareId,x.id)).filter(Boolean);
  if(kjede.length) return { pris:snitt(kjede), status:"estimert", tilbud:false, kilde:"kjede" };
  const alle = SEED_BUTIKKER.map(x=>butikkPris(vareId,x.id)).filter(Boolean);
  if(alle.length) return { pris:snitt(alle), status:"lav", tilbud:false, kilde:"nasjonal" };
  return null;
}
const KILDE_TEKST = { butikk:"Rapportert i butikk", kjede:"Estimert fra kjeden", nasjonal:"Nasjonalt snitt", rapport:"Rapportert av deg", admin:"Lagt inn av administrator", kassalapp:"Ekte pris fra Kassalapp" };
function bestePris(vareId, butikkIds){
  let best = null;
  for(const bid of butikkIds){
    const p = prisMedFallback(vareId, bid);
    if(p && (!best || p.pris < best.pris)) best = {...p, butikkId:bid};
  }
  return best;
}
function erPaaTilbud(vareId, butikkIds){
  return butikkIds.some(bid=>{ const p=butikkPris(vareId,bid); return p && p.tilbud; });
}

/* ════ KUNNSKAPSARTIKLER ════ */
const ARTIKLER_SEED = [
  {id:"upf",emne:"Ultraprosessert",ikon:"🥦",tittel:"Hva er ultraprosessert mat?",innhold:"Ultraprosessert mat (NOVA 4) er industrielt fremstilte produkter med ingredienser du sjelden finner på et kjøkken: emulgatorer, fargestoffer, smaksforsterkere og modifisert stivelse. Typiske eksempler er brus, chips, pølser, ferdigretter og søtt bakverk.\n\nForskning kobler høyt inntak av ultraprosessert mat til økt risiko for overvekt, hjerte- og karsykdom og type 2-diabetes. Et godt utgangspunkt er å la mesteparten av handlekurven bestå av NOVA 1- og 2-varer, og se på NOVA 4 som unntak."},
  {id:"nova",emne:"Ultraprosessert",ikon:"📊",tittel:"Slik vurderes produktene (NOVA)",innhold:"Appen bruker NOVA-skalaen, som deler mat inn etter bearbeidingsgrad.\n\nNOVA 1 – ubearbeidet eller minimalt bearbeidet: frukt, grønt, ferskt kjøtt, fisk, egg og melk. NOVA 2 – bearbeidede kulinariske ingredienser: smør, olje, mel, sukker og salt. NOVA 3 – bearbeidet mat: brød, ost, hermetikk og røkt eller saltet kjøtt. NOVA 4 – ultraprosessert: brus, snacks, pølser og ferdigmat.\n\nSkalaen sier noe om bearbeiding, ikke alt om sunnhet. Olivenolje er NOVA 2 og sunn; juice er NOVA 2 men sukkerrik. Bruk NOVA sammen med næringsinnholdet."},
  {id:"prosessering",emne:"Ultraprosessert",ikon:"⚖️",tittel:"Fordeler og ulemper ved prosessering",innhold:"Ikke all bearbeiding er negativ. Pasteurisering gjør melk trygg, frysing bevarer næringsstoffer i grønnsaker, og hermetisering gjør fisk holdbar uten tilsetninger.\n\nProblemet oppstår når bearbeidingen fjerner fiber og næring og tilfører sukker, salt, fett og tilsetningsstoffer for smak og holdbarhet. Spør deg selv: kunne jeg laget dette på eget kjøkken med vanlige ingredienser? Hvis ja, er det sjelden ultraprosessert."},
  {id:"tolke",emne:"Ultraprosessert",ikon:"🔍",tittel:"Slik tolker du vurderingene i appen",innhold:"Hvert produkt har en NOVA-merkelapp med farge: grønn (1–2), gul (3) og rød (4). Prisene har egen sikkerhetsprikk: grønn er verifisert, gul er estimert og rød har lav sikkerhet.\n\nEt godt handlemønster: velg grønt NOVA-merke der du kan, sjekk næringsinnholdet på tvilstilfeller, og bruk handlekurvens anbefaling til å finne butikken som gir lavest totalsum for dine varer."},
  {id:"protein",emne:"Næring",ikon:"💪",tittel:"Protein – hvor mye og fra hva?",innhold:"Protein bygger og vedlikeholder muskler og metter godt. Et vanlig råd er 0,8–1,6 g per kilo kroppsvekt daglig, høyere ved styrketrening.\n\nGode kilder med mye protein per krone: egg, kyllingfilet, kjøttdeig, skyr, cottage cheese, tunfisk og røde linser. Bruk proteinsorteringen i filteret for å rangere varene etter proteininnhold per 100 g."},
  {id:"kalorier",emne:"Næring",ikon:"🔥",tittel:"Kalorier – det store bildet",innhold:"Kalorier er energien i maten. Vektendring styres over tid av balansen mellom inntak og forbruk.\n\nKaloritette varer som nøtter, oljer og sjokolade er ikke usunne i seg selv, men porsjonsstørrelsen betyr mye. Varer med lav kaloritetthet – grønnsaker, bær og mager fisk – lar deg spise større volum for færre kalorier."},
  {id:"prisperkg",emne:"Økonomi",ikon:"⚖️",tittel:"Pris per kilo og liter",innhold:"Hyllepris kan lure deg – pris per kilo eller liter viser hva varen faktisk koster. En stor pakke med lavere kilopris er ofte billigere enn en liten «billig» pakke.\n\nSammenlign alltid samme enhet: kr/kg mot kr/kg. Vær obs på krympflasjon, der pakkene blir mindre mens prisen står stille."},
  {id:"tilsetning",emne:"Næring",ikon:"🧪",tittel:"Tilsetningsstoffer – hva betyr E-numrene?",innhold:"E-numre er EU-godkjente tilsetningsstoffer. Mange er harmløse – E300 er for eksempel C-vitamin – men et høyt antall tilsetningsstoffer er ofte et tegn på ultraprosessering.\n\nVær særlig obs på nitritt (E250) i bearbeidet kjøtt. Tommelfingerregel: jo kortere ingrediensliste, desto bedre."},
  {id:"sammenligne",emne:"Økonomi",ikon:"🆚",tittel:"Slik sammenligner du produkter",innhold:"Sammenlign tre ting: pris per kilo, NOVA-gruppe og næringsinnhold per 100 g. To kjøttdeiger kan koste det samme, men ha helt ulik fettprosent.\n\nÅpne et produkt i appen for å se alle tre samlet, og legg konkurrerende varianter i samme egendefinerte liste for å vurdere dem side om side."},
  {id:"sparepenger",emne:"Økonomi",ikon:"💰",tittel:"Slik sparer du penger på mat",innhold:"De største grepene: planlegg ukens middager før du handler, handle etter liste, og velg butikken med lavest totalsum for hele kurven – ikke bare enkelttilbud.\n\nFrosne grønnsaker, egg, havregryn og belgfrukter gir mest næring per krone. Unngå småhandler; de drar opp totalen mer enn du tror."},
  {id:"naeringsinnhold",emne:"Næring",ikon:"🏷️",tittel:"Slik leser du næringsinnhold",innhold:"Næringsdeklarasjonen oppgis alltid per 100 g – bruk den til å sammenligne på tvers av merker. Sjekk i denne rekkefølgen: kalorier, protein, sukker og fiber.\n\nIngredienslisten er sortert etter mengde: står sukker blant de tre første, er produktet sukkerdominert uansett hva forsiden lover."},
];

/* ════ LISTEFORSLAG & HJELPERE ════ */
const LISTE_FORSLAG = ["Min ukentlige handleliste","Proteinprodukter","Billig handel","Middager","Treningsmat","Familiehandel"];
const uid = ()=>Math.random().toString(36).slice(2,9);
const FONT = "-apple-system,'Segoe UI',Roboto,sans-serif";
const DAG = 86400000;
const naa = ()=>Date.now();
const dagTekst = (t)=>new Date(t).toLocaleDateString("nb-NO",{day:"numeric",month:"short"});
const xpTilNivaa = (xp)=>{ let l=1; while(25*(l+1)*l<=xp) l++; return l; };
const xpForNivaa = (l)=>25*l*(l-1);
const tillitInfo = (t)=>t>=66?{tekst:"Høy",farge:C.ok}:t>=35?{tekst:"Normal",farge:C.warn}:{tekst:"Lav",farge:C.err};
const BELONNINGER = [
  {id:"r3",level:3,ikon:"🏅",tittel:"Bidragsyter-merke",besk:"Merke som vises på profilen din.",type:"badge"},
  {id:"r5",level:5,ikon:"🎟️",tittel:"10 % rabatt på Premium i 1 mnd",besk:"Neste Premium-måned koster 26 kr i stedet for 29 kr.",type:"rabatt"},
  {id:"r10",level:10,ikon:"⭐",tittel:"1 måned Premium gratis",besk:"Full Premium-tilgang i 30 dager. Må aktiveres innen 30 dager etter opplåsing.",type:"premium1m"},
];
const FAQ = [
  {q:"Hvordan fungerer abonnement?",a:"Premium koster 29 kr/mnd og fjerner reklame og låser opp alle makroer. Du kan si opp når som helst under Profil → Premium; tilgangen varer ut betalt periode."},
  {q:"Hvordan fungerer prisoppdateringer?",a:"Alle kan rapportere priser fra en konkret butikk. Nye priser merkes gule (estimert) til de bekreftes eller godkjennes av administrator – da blir de grønne (verifisert)."},
  {q:"Hvordan endrer jeg butikker?",a:"Gå til Profil → Mine butikker. Der velger du kjeder og konkrete butikker. Handlekurven sammenligner kun butikkene du har valgt."},
  {q:"Hvordan rapporterer jeg feil pris?",a:"Åpne produktet og trykk «Rapporter pris» med riktig beløp – eller opprett en supportsak med kategorien «Feil pris»."},
  {q:"Hvordan fungerer nivåsystemet?",a:"Du får XP for prisrapporter (+10), bekreftelser (+5), bildebevis (+15 ekstra) og godkjente forslag (+25). XP-kravet øker per nivå, og nivåer låser opp belønninger."},
  {q:"Hvordan fungerer Premium?",a:"Premium kan kjøpes (29 kr/mnd) eller låses opp gratis i én måned ved nivå 10. Gratisperioden må aktiveres manuelt innen 30 dager og går over i betalt abonnement hvis du ikke sier opp."},
];
const SAK_KATEGORIER = ["Feil pris","Feil produktinformasjon","Betalingsproblem","Abonnement","Teknisk feil","Forslag til forbedring","Annet"];
const SAK_STATUSER = ["Ny","Under behandling","Venter på bruker","Løst","Lukket"];
const sakStatusFarge = (s)=>s==="Ny"?{f:C.blue,b:C.blueLys}:s==="Løst"?{f:C.ok,b:C.okLys}:s==="Lukket"?{f:C.sub,b:C.bg}:{f:C.warn,b:C.warnLys};

/* ════ IKONER (SVG) ════ */
const Ikon = {
  sok: (f)=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={f} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  kurv: (f)=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={f} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h14l-1.5 9.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5 4H2"/><circle cx="10" cy="21" r="1"/><circle cx="17" cy="21" r="1"/></svg>),
  bok: (f)=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={f} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-2.5"/></svg>),
  person: (f)=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={f} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>),
  tilbake: ()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>),
  stjerne: (fylt)=>(<svg width="22" height="22" viewBox="0 0 24 24" fill={fylt?C.gull:"none"} stroke={fylt?C.gull:C.sub} strokeWidth="2" strokeLinejoin="round"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>),
  pluss: (f)=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={f||"#fff"} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>),
  sjekk: (f)=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={f||"#fff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>),
  laas: ()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>),
  liste: (f)=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={f||C.sub} strokeWidth="2" strokeLinecap="round"><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1.4" fill={f||C.sub} stroke="none"/><circle cx="4" cy="12" r="1.4" fill={f||C.sub} stroke="none"/><circle cx="4" cy="18" r="1.4" fill={f||C.sub} stroke="none"/></svg>),
  hjem: (f)=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={f||C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>),
  info: ()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r="0.8" fill={C.sub} stroke="none"/></svg>),
};

/* ════ SMÅKOMPONENTER ════ */
function NovaBadge({nova, stor}){
  const i = novaInfo(nova);
  if(!i) return null;
  return <span style={{background:i.bg,color:i.farge,borderRadius:7,padding:stor?"4px 10px":"2px 8px",fontSize:stor?13:11,fontWeight:700,whiteSpace:"nowrap"}}>NOVA {nova} · {i.tekst}</span>;
}
function Prikk({kilde, tid}){
  const s = prisSikkerhet(kilde, tid);
  if(!s.visStatus) return null;
  return <span style={{display:"inline-block",width:8,height:8,borderRadius:4,background:s.farge,flexShrink:0}}/>;
}
function SikkerhetTekst({kilde, tid}){
  const s = prisSikkerhet(kilde, tid);
  if(!s.visStatus || !s.tekst) return null;
  return <span style={{fontSize:11.5,color:s.farge,fontWeight:600}}>{s.tekst}</span>;
}
function ProduktBilde({vare, str}){
  const s = str||52;
  if(vare.bilde) return <img src={vare.bilde} alt="" style={{width:s,height:s,borderRadius:10,objectFit:"cover",flexShrink:0}}/>;
  const emoji = (KAT.find(k=>k.id===vare.kat)?.navn||"📦").split(" ")[0];
  return <div style={{width:s,height:s,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:s*0.45,flexShrink:0}}>{emoji}</div>;
}

/* ════ VISUELL GUIDE ════ */
const GUIDE_STEG = [
  {
    ikon:"🛒",
    tittel:"Smart handlekurv",
    tekst:"Legg varer i handlekurven og velg hvor mange butikker du vil innom. Appen finner den billigste kombinasjonen automatisk.",
    tips:"Velg 2–3 butikker for å spare penger uten for mange stopp."
  },
  {
    ikon:"🥦",
    tittel:"NOVA-merking",
    tekst:"Hvert produkt er merket 1–4 basert på hvor bearbeidet det er. Grønn = naturlig mat, rød = ultraprosessert.",
    tips:"Les mer om NOVA under Kunnskap-fanen."
  },
  {
    ikon:"📈",
    tittel:"Bidra og tjen XP",
    tekst:"Rapporter priser du ser i butikken. Bekreft andres priser. Du stiger i nivå og kan låse opp gratis Premium.",
    tips:"Nivå 10 gir 1 måned gratis Premium."
  },
];

function GuideModal({onLukk}){
  const [steg, setSteg] = useState(0);
  const s = GUIDE_STEG[steg];
  const siste = steg === GUIDE_STEG.length - 1;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(16,24,40,0.55)",zIndex:70,display:"flex",alignItems:"flex-end",fontFamily:FONT}} onClick={onLukk}>
      <div style={{background:C.card,borderRadius:"22px 22px 0 0",width:"100%",boxSizing:"border-box",paddingBottom:28,animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Fremdriftsstriper */}
        <div style={{display:"flex",gap:5,padding:"16px 20px 0"}}>
          {GUIDE_STEG.map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=steg?C.blue:C.border,transition:"background .2s"}}/>
          ))}
        </div>

        {/* Lukk-knapp */}
        <div style={{display:"flex",justifyContent:"flex-end",padding:"10px 16px 0"}}>
          <button onClick={onLukk} style={{background:"none",border:"none",fontSize:13,color:C.sub,cursor:"pointer",fontWeight:600,padding:"4px 8px"}}>Hopp over</button>
        </div>

        {/* Innhold */}
        <div style={{padding:"4px 28px 20px",textAlign:"center"}}>
          <div style={{fontSize:56,marginBottom:14,lineHeight:1}}>{s.ikon}</div>
          <h2 style={{fontSize:21,fontWeight:800,margin:"0 0 10px",color:C.text,letterSpacing:-0.4}}>{s.tittel}</h2>
          <p style={{fontSize:14.5,color:C.sub,lineHeight:1.65,margin:"0 0 16px"}}>{s.tekst}</p>
          <div style={{background:C.blueLys,borderRadius:12,padding:"10px 16px",display:"flex",gap:10,alignItems:"flex-start",textAlign:"left"}}>
            <span style={{fontSize:16}}>💡</span>
            <span style={{fontSize:13,color:C.blue,fontWeight:600,lineHeight:1.5}}>{s.tips}</span>
          </div>
        </div>

        {/* Navigasjon */}
        <div style={{display:"flex",gap:10,padding:"0 20px"}}>
          {steg > 0 && (
            <button onClick={()=>setSteg(s=>s-1)} style={{...sKnappSek,width:"auto",flex:1,padding:"13px 12px",fontSize:15}}>← Tilbake</button>
          )}
          <button onClick={()=>siste?onLukk():setSteg(s=>s+1)} style={{...sKnapp,width:"auto",flex:2,padding:"13px 12px",fontSize:15}}>
            {siste?"Kom i gang 🎉":"Neste →"}
          </button>
        </div>

        {/* Steg-indikator */}
        <div style={{textAlign:"center",marginTop:12,fontSize:12,color:C.sub}}>
          {steg+1} av {GUIDE_STEG.length}
        </div>

      </div>
    </div>
  );
}

/* ════ ONBOARDING ════ */
function Onboarding({onFerdig}){
  const [steg,setSteg] = useState(0);
  const [kjeder,setKjeder] = useState(Object.keys(KJEDER));
  const [butikker,setButikker] = useState([]);
  const [posisjonStatus,setPosisjonStatus] = useState("idle");
  const [ekteOnboardingButikker,setEkteOnboardingButikker] = useState([]);
  const [butikkSok,setButikkSok] = useState("");

  // Last ekte butikker fra cache/proxy når bruker er på kjedesteg
  useEffect(()=>{
    if(steg<1 || ekteOnboardingButikker.length) return;
    (async()=>{
      try{
        const cache = await window.storage.get("matpilot-butikker-cache").catch(()=>null);
        if(cache){
          const {butikker:b,tid}=JSON.parse(cache.value);
          if(Date.now()-tid<24*3600000 && b.length>100){ setEkteOnboardingButikker(b); return; }
        }
        const r1=await fetch(${PROXY_URL}/api/stores?size=100&page=1);
        if(!r1.ok) return;
        const d1=await r1.json();
        const alle=[...(d1.butikker||[])];
        const sisteSide=Math.min(d1.meta?.last_page||1,60);
        for(let start=2;start<=sisteSide;start+=10){
          const slutt=Math.min(start+9,sisteSide);
          const res=await Promise.allSettled(Array.from({length:slutt-start+1},(_,i)=>start+i).map(s=>fetch(${PROXY_URL}/api/stores?size=100&page=${s}).then(r=>r.ok?r.json():null)));
          for(const r of res) if(r.status==="fulfilled"&&r.value?.butikker) alle.push(...r.value.butikker);
        }
        if(alle.length){
          setEkteOnboardingButikker(alle);
          await window.storage.set("matpilot-butikker-cache",JSON.stringify({butikker:alle,tid:Date.now()})).catch(()=>{});
        }
      }catch(e){}
    })();
  },[steg]);

  const alleButikkerOnboarding = useMemo(()=>{
    if(!ekteOnboardingButikker.length) return SEED_BUTIKKER;
    const eksId=new Set(SEED_BUTIKKER.map(b=>b.id));
    return [...SEED_BUTIKKER,...ekteOnboardingButikker.filter(b=>!eksId.has(b.id))];
  },[ekteOnboardingButikker]);

  const toggleKjede = (k)=>setKjeder(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);
  const toggleButikk = (id)=>setButikker(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const finnNaermeste = ()=>{
    if(!navigator.geolocation){ setPosisjonStatus("avvist"); return; }
    setPosisjonStatus("laster");
    navigator.geolocation.getCurrentPosition(
      (pos)=>{
        const {latitude:lat,longitude:lng}=pos.coords;
        const aktuelle=alleButikkerOnboarding.filter(b=>kjeder.includes(b.kjede));
        const medAvstand=aktuelle.map(b=>{
          if(b.lat&&b.lng){
            const dLat=(b.lat-lat)*Math.PI/180,dLng=(b.lng-lng)*Math.PI/180;
            const a=Math.sin(dLat/2)**2+Math.cos(lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
            return {...b,avstand:6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))};
          }
          return {...b,avstand:9999};
        });
        const naermeste=medAvstand.sort((a,b)=>a.avstand-b.avstand).slice(0,6).map(b=>b.id);
        setButikker(naermeste);
        setPosisjonStatus("ok");
      },
      ()=>setPosisjonStatus("avvist")
    );
  };
  const aktuelle = alleButikkerOnboarding.filter(b=>kjeder.includes(b.kjede));

  const Fremdrift = ()=>(
    <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:24}}>
      {[0,1,2].map(i=><div key={i} style={{width:i===steg?24:8,height:8,borderRadius:4,background:i<=steg?C.blue:C.border,transition:"all .25s"}}/>)}
    </div>
  );

  if(steg===0) return (
    <div style={{minHeight:"100vh",background:C.card,display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 28px",boxSizing:"border-box",fontFamily:"-apple-system,'Segoe UI',Roboto,sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:84,height:84,borderRadius:24,background:C.blueLys,display:"flex",alignItems:"center",justifyContent:"center",fontSize:42,margin:"0 auto 18px"}}>🛒</div>
        <h1 style={{fontSize:30,fontWeight:800,margin:"0 0 8px",color:C.text,letterSpacing:-0.5}}>Matpilot</h1>
        <p style={{fontSize:15,color:C.sub,margin:0,lineHeight:1.5}}>Smartere matvalg. Lavere matbudsjett.</p>
      </div>
      {[
        ["💰","Sammenlign priser","Se hvilken av dine butikker som gir lavest totalsum."],
        ["🥦","Forstå maten","NOVA-merking viser hvor bearbeidet hvert produkt er."],
        ["🤝","Bygget av fellesskapet","Brukere rapporterer og verifiserer priser sammen."],
      ].map(([ikon,t,b])=>(
        <div key={t} style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:18}}>
          <div style={{fontSize:26,lineHeight:1}}>{ikon}</div>
          <div><div style={{fontWeight:700,fontSize:15,color:C.text}}>{t}</div><div style={{fontSize:13.5,color:C.sub,lineHeight:1.45}}>{b}</div></div>
        </div>
      ))}
      <button style={{...sKnapp,marginTop:24}} onClick={()=>setSteg(1)}>Kom i gang</button>
      <p style={{textAlign:"center",fontSize:12.5,color:C.sub,marginTop:14}}>Ingen konto nødvendig – du kan opprette en senere.</p>
    </div>
  );

  if(steg===1) return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"36px 20px 120px",boxSizing:"border-box",fontFamily:"-apple-system,'Segoe UI',Roboto,sans-serif"}}>
      <Fremdrift/>
      <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 6px",color:C.text}}>Hvilke kjeder handler du i?</h2>
      <p style={{fontSize:14,color:C.sub,margin:"0 0 20px",lineHeight:1.5}}>Velg kjedene som er aktuelle for deg. Dette kan endres når som helst under Profil → Mine butikker.</p>
      <div style={{marginBottom:14}}>
        {["NorgesGruppen","Coop","Rema","Bunnpris","Europris","FUDI","Havaristen","Nettbutikk"].map(gruppe=>{
          const kjedeEntries = Object.entries(KJEDER).filter(([,i])=>i.gruppe===gruppe);
          if(!kjedeEntries.length) return null;
          return (
            <div key={gruppe} style={{marginBottom:12}}>
              <div style={{fontSize:11.5,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{gruppe}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {kjedeEntries.map(([k,info])=>{
                  const valgt = kjeder.includes(k);
                  return (
                    <button key={k} onClick={()=>toggleKjede(k)} style={{...sCard,padding:"12px 10px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",border:valgt?`2px solid ${C.blue}`:`1px solid ${C.border}`,background:valgt?C.blueLys:"#fff"}}>
                      <div style={{width:10,height:10,borderRadius:5,background:info.farge,flexShrink:0}}/>
                      <span style={{fontSize:13,fontWeight:700,color:C.text,flex:1,textAlign:"left"}}>{info.navn}</span>
                      {valgt && <div style={{width:18,height:18,borderRadius:9,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Ikon.sjekk()}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position:"fixed",left:0,right:0,bottom:0,padding:"14px 20px 24px",background:"linear-gradient(transparent, #F6F7F9 30%)"}}>
        <button style={{...sKnapp,opacity:kjeder.length?1:0.4}} disabled={!kjeder.length} onClick={()=>setSteg(2)}>
          Neste {kjeder.length?`(${kjeder.length} kjeder)`:""}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"36px 20px 120px",boxSizing:"border-box",fontFamily:"-apple-system,'Segoe UI',Roboto,sans-serif"}}>
      <Fremdrift/>
      <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 6px",color:C.text}}>Velg dine butikker</h2>
      <p style={{fontSize:14,color:C.sub,margin:"0 0 16px",lineHeight:1.5}}>Handlekurven sammenligner kun butikkene du velger her. Du kan endre dette senere i innstillingene.</p>

      {/* Posisjonsknapp */}
      <button onClick={finnNaermeste} disabled={posisjonStatus==="laster"} style={{...sKnappSek,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:posisjonStatus==="laster"?0.6:1}}>
        {posisjonStatus==="laster" ? "📍 Finner nærmeste butikker…"
         : posisjonStatus==="ok"   ? "📍 Nærmeste butikker er valgt ✓"
         : posisjonStatus==="avvist" ? "📍 Tilgang avvist – velg manuelt"
         : "📍 Finn nærmeste butikker automatisk"}
      </button>
      {posisjonStatus==="avvist" && <p style={{fontSize:12.5,color:C.warn,margin:"-8px 0 14px",lineHeight:1.5}}>Appen fikk ikke tilgang til posisjonen din. Gi tilgang under Innstillinger → Personvern → Stedstjenester, eller velg butikker manuelt under.</p>}
      {posisjonStatus==="ok" && <p style={{fontSize:12.5,color:C.ok,margin:"-8px 0 14px",lineHeight:1.5}}>Fant de nærmeste butikkene. Du kan justere valget under.</p>}
      {ekteOnboardingButikker.length===0 && <p style={{fontSize:12,color:C.sub,margin:"-8px 0 14px",lineHeight:1.5}}>⏳ Laster alle butikker i bakgrunnen…</p>}

      {/* Søkefelt */}
      <div style={{position:"relative",marginBottom:12}}>
        <div style={{position:"absolute",left:12,top:11}}>{Ikon.sok(C.sub)}</div>
        <input style={{...sInput,paddingLeft:40}} placeholder="Søk etter butikk eller sted…" value={butikkSok} onChange={e=>setButikkSok(e.target.value)}/>
      </div>

      {/* Bokstavindeks + scrollbar */}
      {(()=>{
        const filtrerte = butikkSok.trim()
          ? aktuelle.filter(b=>b.navn.toLowerCase().includes(butikkSok.toLowerCase())||b.sted.toLowerCase().includes(butikkSok.toLowerCase()))
          : aktuelle;
        const steder=[...new Set(filtrerte.map(b=>b.sted))].sort();
        const bokstaver=[...new Set(steder.map(s=>s[0].toUpperCase()))].sort();
        return (
          <div style={{position:"relative"}}>
            {/* Bokstavindeks i høyrekanten */}
            <div style={{position:"fixed",right:4,top:"50%",transform:"translateY(-50%)",zIndex:20,display:"flex",flexDirection:"column",gap:1}}>
              {bokstaver.map(bkstav=>(
                <button key={bkstav} onClick={()=>document.getElementById("sted-"+bkstav)?.scrollIntoView({behavior:"smooth",block:"start"})}
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:800,color:C.blue,padding:"1px 4px",lineHeight:1.4}}>
                  {bkstav}
                </button>
              ))}
            </div>

            {/* Butikkliste per sted */}
            {steder.map(sted=>{
              const bs=filtrerte.filter(b=>b.sted===sted);
              const bkstav=sted[0].toUpperCase();
              return (
                <div key={sted} id={"sted-"+bkstav} style={{marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4}}>📍 {sted}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {bs.map(b=>{
                      const valgt=butikker.includes(b.id);
                      return (
                        <button key={b.id} onClick={()=>toggleButikk(b.id)} style={{...sCard,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:valgt?`2px solid ${C.blue}`:`1px solid ${C.border}`,background:valgt?C.blueLys:"#fff",textAlign:"left"}}>
                          <div style={{width:8,height:8,borderRadius:4,background:KJEDER[b.kjede]?.farge||C.sub,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14.5,fontWeight:700,color:C.text}}>{b.navn}</div>
                            <div style={{fontSize:12.5,color:C.sub}}>{b.adresse}</div>
                          </div>
                          <div style={{width:22,height:22,borderRadius:11,border:valgt?"none":`2px solid ${C.border}`,background:valgt?C.blue:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            {valgt && Ikon.sjekk()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      {(()=>{
        const aktuelle = SEED_BUTIKKER.filter(b=>kjeder.includes(b.kjede));
        const steder = [...new Set(aktuelle.map(b=>b.sted))].sort();
        return steder.map(sted=>{
          const bs = aktuelle.filter(b=>b.sted===sted);
          return (
            <div key={sted} style={{marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4}}>📍 {sted}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {bs.map(b=>{
                  const valgt = butikker.includes(b.id);
                  return (
                    <button key={b.id} onClick={()=>toggleButikk(b.id)} style={{...sCard,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:valgt?`2px solid ${C.blue}`:`1px solid ${C.border}`,background:valgt?C.blueLys:"#fff",textAlign:"left"}}>
                      <div style={{width:8,height:8,borderRadius:4,background:KJEDER[b.kjede]?.farge||C.sub,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14.5,fontWeight:700,color:C.text}}>{b.navn}</div>
                        <div style={{fontSize:12.5,color:C.sub}}>{b.adresse}</div>
                      </div>
                      <div style={{width:22,height:22,borderRadius:11,border:valgt?"none":`2px solid ${C.border}`,background:valgt?C.blue:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {valgt && Ikon.sjekk()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        });
      })()}
      <div style={{position:"fixed",left:0,right:0,bottom:0,padding:"14px 20px 24px",background:"linear-gradient(transparent, #F6F7F9 30%)",display:"flex",flexDirection:"column",gap:8}}>
        <button style={{...sKnapp,opacity:butikker.length?1:0.4}} disabled={!butikker.length} onClick={()=>onFerdig(butikker)}>
          Start å bruke Matpilot {butikker.length?`(${butikker.length} butikker)`:""}
        </button>
        <button style={lnk} onClick={()=>setSteg(1)}>← Tilbake til kjeder</button>
      </div>
    </div>
  );
}

/* ════ PRODUKTKORT ════ */
function ProduktKort({vare, butikkIds, pv, paaTilbud, favoritt, onAapne, onLeggTil, onFavoritt, onSammenlign, sammenlignModus}){
  const best = useMemo(()=>bestePris(vare.id, butikkIds), [vare.id, butikkIds, pv]);
  const butikk = best ? SEED_BUTIKKER.find(b=>b.id===best.butikkId) : null;
  const ni = novaInfo(vare.nova);
  const prisPrKg = best && utledVekt(vare) ? (best.pris / utledVekt(vare) * 1000).toFixed(2).replace(".",",") : null;
  const score = useMemo(()=>produktScore(vare, butikkIds), [vare.id, butikkIds, pv]);
  const anbefalt = score !== null && score >= 7.5;
  const valgtTilSamm = sammenlignModus?.includes(vare.id);

  return (
    <div style={{...sCard,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer",
      borderLeft:`4px solid ${valgtTilSamm?C.blue:ni.farge}`,
      outline:valgtTilSamm?`2px solid ${C.blue}`:"none"
    }} onClick={onAapne}>
      <ProduktBilde vare={vare}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1,flexWrap:"wrap"}}>
          <div style={{fontSize:14.5,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{vare.navn}</div>
          {anbefalt && (
            <span
              onClick={(e)=>{e.stopPropagation(); alert(⭐ Anbefalt\n\nDette produktet har score ${score?.toFixed(1)}/10 basert på:\n• Lite bearbeidet (NOVA ${vare.nova ?? "–"})\n• Proteininnhold${vare.m?.protein!=null?" ("+vare.m.protein+"g)":""}\n• Pris i forhold til lignende produkter\n\nScore over 7,5 gir Anbefalt-merket.);}}
              style={{background:C.ok,color:"#fff",borderRadius:6,fontSize:10,fontWeight:800,padding:"1px 6px",flexShrink:0,cursor:"pointer"}}
            >★ Anbefalt ℹ️</span>
          )}
          {paaTilbud && <span style={{background:C.tilbud,color:C.tilbudTekst,border:`1px solid ${C.tilbudKant}`,borderRadius:6,fontSize:10,fontWeight:800,padding:"1px 6px",flexShrink:0}}>TILBUD</span>}
        </div>
        <div style={{fontSize:12,color:C.sub,marginBottom:5}}>{vare.prod}</div>
        {best ? (
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
            <span style={{fontSize:16,fontWeight:800,color:C.text}}>{best.pris.toFixed(2).replace(".",",")} kr</span>
            {prisPrKg && <span style={{fontSize:11,color:C.sub}}>· {prisPrKg} kr/kg</span>}
            <Prikk kilde={best.kilde} tid={best.tid||0}/>
          </div>
        ) : <div style={{fontSize:12.5,color:C.sub,marginBottom:5}}>Pris mangler</div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {vare.nova && (
            <span style={{background:ni.farge+"22",color:ni.farge,borderRadius:6,fontSize:10.5,fontWeight:800,padding:"2px 7px"}}>{ni.kort}</span>
          )}
          {vare.m?.protein!=null && (
            <span style={{background:C.bg,color:C.sub,borderRadius:6,fontSize:10.5,fontWeight:600,padding:"2px 7px"}}>💪 {vare.m.protein}g</span>
          )}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"center",paddingTop:2}}>
        <button onClick={(e)=>{e.stopPropagation();onFavoritt();}} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>{Ikon.stjerne(favoritt)}</button>
        {onSammenlign && (
          <button onClick={(e)=>{e.stopPropagation();onSammenlign(vare.id);}}
            style={{width:32,height:32,borderRadius:16,background:valgtTilSamm?C.blue:C.bg,border:`1px solid ${valgtTilSamm?C.blue:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14}}>
            ⚖️
          </button>
        )}
        <button onClick={(e)=>{e.stopPropagation();onLeggTil();}} style={{width:32,height:32,borderRadius:16,background:C.blue,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{Ikon.pluss()}</button>
      </div>
    </div>
  );
}

/* ════ PRODUKTDETALJ ════ */
/* ════ PRODUKTSCORE OG ALTERNATIVER ════ */
// Utled vekt i gram fra produktnavn ("1L", "500g", "1,5kg" osv.)
function utledVekt(vare){
  if(vare.vekt) return vare.vekt;
  const n = vare.navn.toLowerCase();
  let m;
  if((m = n.match(/(\d+[.,]?\d*)\s*kg/))) return parseFloat(m[1].replace(",","."))*1000;
  if((m = n.match(/(\d+[.,]?\d*)\s*l\b/))) return parseFloat(m[1].replace(",","."))*1000;
  if((m = n.match(/(\d+)\s*g\b/))) return parseFloat(m[1]);
  if((m = n.match(/(\d+)\s*ml/))) return parseFloat(m[1]);
  if((m = n.match(/(\d+[.,]?\d*)\s*dl/))) return parseFloat(m[1].replace(",","."))*100;
  return null;
}
// Samlet score 0-10 basert på pris (per kg), protein og NOVA.
// Høyere = bedre verdi for pengene og ernæringsmessig.
function produktScore(vare, butikkIds){
  const best = bestePris(vare.id, butikkIds);
  if(!best || !vare.m) return null;
  // NOVA-komponent: NOVA 1 = 10, NOVA 2 = 7, NOVA 3 = 4, NOVA 4 = 1
  const novaScore = vare.nova ? {1:10,2:7,3:4,4:1}[vare.nova] : 5;
  // Protein-komponent: 0g=0, 20g+=10
  const proteinScore = Math.min(10, (vare.m?.protein||0) / 2);
  // Pris-komponent: lavere pris/kg gir høyere score (relativt i kategorien)
  const sammeKat = VARER.filter(v=>v.kat===vare.kat && v.m);
  const priser = sammeKat.map(v=>{
    const b = bestePris(v.id, butikkIds);
    return b && utledVekt(v) ? b.pris/utledVekt(v)*1000 : null;
  }).filter(x=>x!=null);
  let prisScore = 5;
  if(priser.length>1 && utledVekt(vare)){
    const minP = Math.min(...priser), maxP = Math.max(...priser);
    const egen = best.pris/utledVekt(vare)*1000;
    prisScore = maxP>minP ? 10 - ((egen-minP)/(maxP-minP))*10 : 5;
  }
  // Vekting: NOVA 40%, protein 30%, pris 30%
  const total = novaScore*0.4 + proteinScore*0.3 + prisScore*0.3;
  return Math.round(total*10)/10;
}

// Finn alternativer i samme kategori
function finnAlternativer(vare, butikkIds){
  const egenPris = bestePris(vare.id, butikkIds);
  const sammeKat = VARER.filter(v=>v.id!==vare.id && v.kat===vare.kat);

  // Billigere alternativer (per kg hvis mulig, ellers absolutt)
  const billigere = sammeKat.map(v=>{
    const b = bestePris(v.id, butikkIds);
    if(!b || !egenPris) return null;
    return {vare:v, pris:b.pris, billigere: b.pris < egenPris.pris};
  }).filter(x=>x && x.billigere).sort((a,b)=>a.pris-b.pris).slice(0,3);

  // Mindre prosesserte (lavere NOVA)
  const mindreProsessert = vare.nova ? sammeKat.map(v=>{
    const b = bestePris(v.id, butikkIds);
    if(!b || !v.nova || v.nova >= vare.nova) return null;
    return {vare:v, pris:b.pris, nova:v.nova};
  }).filter(Boolean).sort((a,b)=>a.nova-b.nova).slice(0,3) : [];

  // Mer protein per krone
  const merProtein = vare.m?.protein ? sammeKat.map(v=>{
    const b = bestePris(v.id, butikkIds);
    if(!b || !v.m?.protein) return null;
    const ppk = v.m.protein / b.pris;
    const egenPpk = egenPris ? (vare.m?.protein||0) / egenPris.pris : 0;
    return ppk > egenPpk ? {vare:v, pris:b.pris, protein:v.m.protein, ppk} : null;
  }).filter(Boolean).sort((a,b)=>b.ppk-a.ppk).slice(0,3) : [];

  return {billigere, mindreProsessert, merProtein};
}

function ProduktDetalj({vare, butikkIds, favoritt, premium, pv, onTilbake, onLeggTil, onFavoritt, onLeggIListe, onRapporter, onBekreft, onAapne, onAapnePremium}){
  const priser = useMemo(()=>
    butikkIds.map(bid=>({butikk:SEED_BUTIKKER.find(b=>b.id===bid), p:prisMedFallback(vare.id,bid)}))
      .filter(x=>x.p).sort((a,b)=>a.p.pris-b.p.pris)
  ,[vare.id,butikkIds,pv]);
  const score = useMemo(()=>produktScore(vare, butikkIds),[vare.id,butikkIds,pv]);
  const alternativer = useMemo(()=>finnAlternativer(vare, butikkIds),[vare.id,butikkIds,pv]);
  const ni = novaInfo(vare.nova);
  const billigst = priser[0];
  const prisPrKg = billigst && utledVekt(vare) ? (billigst.p.pris/utledVekt(vare)*1000).toFixed(2).replace(".",",") : null;

  const AltKort = ({vare:v, undertekst, onClick})=>{
    const ni2 = novaInfo(v.nova);
    return (
      <div onClick={onClick} style={{...sCard,minWidth:140,maxWidth:160,padding:12,flexShrink:0,cursor:"pointer",borderLeft:`3px solid ${ni2.farge}`}}>
        <ProduktBilde vare={v} str={40} style={{marginBottom:8}}/>
        <div style={{fontSize:12.5,fontWeight:700,color:C.text,lineHeight:1.3,marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{v.navn}</div>
        <div style={{fontSize:11.5,color:C.ok,fontWeight:700}}>{undertekst}</div>
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:110,fontFamily:FONT}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:5}}>
        <button onClick={onTilbake} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>{Ikon.tilbake()}</button>
        <span style={{fontSize:16,fontWeight:800,color:C.text,flex:1}}>Produkt</span>
        <button onClick={onFavoritt} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>{Ikon.stjerne(favoritt)}</button>
      </div>
      <div style={{padding:"18px 16px"}}>
        <div style={{...sCard,padding:18,marginBottom:14}}>
          <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12}}>
            <ProduktBilde vare={vare} str={72}/>
            <div style={{flex:1,minWidth:0}}>
              <h2 style={{fontSize:19,fontWeight:800,margin:"0 0 2px",color:C.text,lineHeight:1.25}}>{vare.navn}</h2>
              <div style={{fontSize:13.5,color:C.sub}}>{vare.prod}</div>
            </div>
            {score!=null && (
              <div style={{textAlign:"center",flexShrink:0}}>
                <div style={{fontSize:22,fontWeight:800,color:score>=7?C.ok:score>=4?C.warn:C.err,lineHeight:1}}>{score.toFixed(1)}</div>
                <div style={{fontSize:10,color:C.sub,fontWeight:700}}>SCORE</div>
              </div>
            )}
          </div>
          {/* Pris + pris per kg */}
          {billigst && (
            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
              <span style={{fontSize:24,fontWeight:800,color:C.text}}>{billigst.p.pris.toFixed(2).replace(".",",")} kr</span>
              {prisPrKg && <span style={{fontSize:13,color:C.sub}}>{prisPrKg} kr/kg</span>}
              <span style={{fontSize:12,color:C.sub}}>· billigst hos {billigst.butikk.navn}</span>
            </div>
          )}
          {vare.nova && <NovaBadge nova={vare.nova} stor/>}
        </div>

        {/* NOVA-forklaring */}
        {vare.nova && (
          <div style={{...sCard,padding:16,marginBottom:14,borderLeft:`4px solid ${ni.farge}`}}>
            <div style={{fontSize:13.5,fontWeight:800,color:ni.farge,marginBottom:4}}>{ni.tekst} (NOVA {vare.nova})</div>
            <p style={{fontSize:12.5,color:C.sub,margin:0,lineHeight:1.55}}>
              {vare.nova===1 && "Ubearbeidet eller minimalt bearbeidet mat – råvarer som er nær sin naturlige tilstand. Den sunneste kategorien."}
              {vare.nova===2 && "Bearbeidede kulinariske ingredienser som olje, smør, sukker og salt – brukes til matlaging, sjelden spist alene."}
              {vare.nova===3 && "Bearbeidet mat laget ved å tilsette salt, sukker eller olje til NOVA 1-råvarer. Greit i moderate mengder."}
              {vare.nova===4 && "Ultraprosessert mat med tilsetningsstoffer, smaksforsterkere og industrielle ingredienser. Bør begrenses i kostholdet."}
            </p>
          </div>
        )}

        {vare.m && (
          <div style={{...sCard,padding:18,marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 10px",color:C.text}}>Næringsinnhold per 100 g</h3>
            {MAKRO_DEF.map(md=>{
              const laast = md.premium && !premium;
              return (
                <div key={md.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:13.5,color:C.text,fontWeight:600}}>{md.navn}</span>
                  {laast
                    ? <span onClick={onAapnePremium} style={{fontSize:13.5,fontWeight:800,color:C.text,filter:"blur(5px)",cursor:"pointer",userSelect:"none"}}>00 {md.enhet}</span>
                    : <span style={{fontSize:13.5,fontWeight:800,color:C.text}}>{vare.m[md.id]} {md.enhet}</span>}
                </div>
              );
            })}
            {MAKRO_DEF.some(md=>md.premium) && !premium && (
              <button onClick={onAapnePremium} style={{...sKnappSek,marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:13}}>
                👑 Lås opp fullt næringsinnhold med Premium
              </button>
            )}
          </div>
        )}

        {/* Alternativer */}
        {alternativer.billigere.length>0 && (
          <div style={{marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 8px",color:C.text}}>💰 Billigere alternativer</h3>
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
              {alternativer.billigere.map(({vare:v,pris})=>(
                <AltKort key={v.id} vare={v} undertekst={`${pris.toFixed(2).replace(".",",")} kr`} onClick={()=>onAapne(v)}/>
              ))}
            </div>
          </div>
        )}

        {alternativer.mindreProsessert.length>0 && (
          <div style={{marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 8px",color:C.text}}>🥦 Mindre prosesserte alternativer</h3>
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
              {alternativer.mindreProsessert.map(({vare:v})=>(
                <AltKort key={v.id} vare={v} undertekst={novaInfo(v.nova).tekst} onClick={()=>onAapne(v)}/>
              ))}
            </div>
          </div>
        )}

        {alternativer.merProtein.length>0 && (
          <div style={{marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 8px",color:C.text}}>💪 Mer protein per krone</h3>
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
              {alternativer.merProtein.map(({vare:v,protein})=>(
                <AltKort key={v.id} vare={v} undertekst={`${protein}g protein`} onClick={()=>onAapne(v)}/>
              ))}
            </div>
          </div>
        )}

        <div style={{...sCard,padding:18}}>
          <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 4px",color:C.text}}>Priser i dine butikker</h3>
          <p style={{fontSize:12.5,color:C.sub,margin:"0 0 12px"}}>Sortert fra lavest til høyest. Prikken viser hvor sikker prisen er. Bekreft priser du vet stemmer – det gir XP og bedre data for alle.</p>
          {priser.length===0 && <p style={{fontSize:13.5,color:C.sub}}>Ingen prisdata for dette produktet ennå. Bli den første til å rapportere!</p>}
          {priser.map(({butikk,p},i)=>{
            const kanBekreftes = (p.kilde==="butikk") && p.status!=="verifisert" && !erBekreftet(vare.id,butikk.id);
            return (
              <div key={butikk.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<priser.length-1?`1px solid ${C.border}`:"none"}}>
                <div style={{width:10,height:10,borderRadius:5,background:KJEDER[butikk.kjede]?.farge||C.sub,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:C.text}}>{butikk.navn}{i===0 && <span style={{color:C.ok,fontSize:11,fontWeight:800,marginLeft:6}}>BILLIGST</span>}</div>
                  <div style={{fontSize:11.5,color:C.sub,display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                    <Prikk kilde={p.kilde} tid={p.tid||0}/> <SikkerhetTekst kilde={p.kilde} tid={p.tid||0}/>
                    {(p.kilde==="simulert" || (p.kilde==="rapport" && Date.now()-(p.tid||0) > TRE_DAGER)) && (
                      <button onClick={(e)=>{e.stopPropagation();onRapporter();}} style={{background:"none",border:"none",color:"#F59E0B",fontSize:11.5,fontWeight:800,cursor:"pointer",padding:0,textDecoration:"underline"}}>
                        + Legg til pris
                      </button>
                    )}
                    {kanBekreftes && <button style={{...lnk,fontSize:11.5}} onClick={()=>onBekreft(butikk.id)}>Bekreft (+5 XP)</button>}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:15,fontWeight:800,color:C.text}}>{p.pris.toFixed(2).replace(".",",")} kr</div>
                  {p.tilbud && <span style={{background:C.tilbud,color:C.tilbudTekst,border:`1px solid ${C.tilbudKant}`,borderRadius:6,fontSize:10,fontWeight:800,padding:"1px 6px"}}>TILBUD</span>}
                </div>
              </div>
            );
          })}
          <button style={{...sKnappSek,marginTop:14}} onClick={onRapporter}>Rapporter pris (+10 XP)</button>
        </div>
      </div>
      <div style={{position:"fixed",left:0,right:0,bottom:0,padding:"12px 16px 22px",background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
        <button style={{...sKnappSek,width:"auto",flex:1}} onClick={onLeggIListe}>Legg i liste</button>
        <button style={{...sKnapp,width:"auto",flex:1.3}} onClick={onLeggTil}>Legg i handlekurv</button>
      </div>
    </div>
  );
}

/* ════ HJEMSIDE ════ */
function HjemSide({bruker, butikkIds, kurv, favoritter, lister, pv, premium, onAapne, onLeggTil, onFavoritt, onGaaTab, onAapneSide, nyligSett}){
  const antallIKurv = Object.values(kurv).reduce((s,n)=>s+n,0);
  const antallFavoritter = favoritter.length;
  const [ektePrisfall, setEktePrisfall] = useState([]);

  // Hent ekte prisfall fra Kassalapp via proxy
  useEffect(()=>{
    (async()=>{
      try{
        const r = await fetch(${PROXY_URL}/api/prisfall?size=20);
        if(!r.ok) return;
        const d = await r.json();
        if(d.prisfall?.length) setEktePrisfall(d.prisfall);
      } catch(e){}
    })();
  },[]);

  // Beste kjøp: varer med tilbud fra brukerens butikker
  const besteKjop = useMemo(()=>{
    return VARER.map(v=>{
      const best = bestePris(v.id, butikkIds);
      return best ? {vare:v, ...best} : null;
    }).filter(Boolean)
      .filter(x=>x.tilbud)
      .sort((a,b)=>a.pris-b.pris)
      .slice(0,6);
  },[butikkIds, pv]);

  // Billigste protein: pris per gram protein
  const billigProtein = useMemo(()=>{
    return VARER.filter(v=>v.m?.protein>0)
      .map(v=>{
        const best = bestePris(v.id, butikkIds);
        if(!best) return null;
        const prisPerGram = best.pris / v.m.protein;
        return {vare:v, ...best, prisPerGram};
      }).filter(Boolean)
        .sort((a,b)=>a.prisPerGram-b.prisPerGram)
        .slice(0,4);
  },[butikkIds, pv]);

  const valgteButikker = butikkIds.map(id=>SEED_BUTIKKER.find(b=>b.id===id)).filter(Boolean);
  const fornavn = bruker?.navn?.split(" ")[0] || null;
  const time = new Date().getHours();
  const hilsen = time < 10 ? "God morgen" : time < 12 ? "God formiddag" : time < 17 ? "Hei" : time < 21 ? "God kveld" : "Hei";
  const undertittel = antallIKurv > 0
    ? Du har ${antallIKurv} vare${antallIKurv!==1?"r":""} i handlekurven 🛒
    : besteKjop.length > 0
    ? "Det er gode tilbud i dine butikker i dag!"
    : "Klar til å handle smart?";

  return (
    <div style={{padding:"16px 16px 0",paddingBottom:20}}>

      {/* ── Header ── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,color:C.sub,marginBottom:2}}>{hilsen}{fornavn?`, ${fornavn}`:""} 👋</div>
        <h1 style={{fontSize:26,fontWeight:800,margin:0,color:C.text,letterSpacing:-0.5}}>{undertittel}</h1>
      </div>

      {/* ── Valgte butikker ── */}
      <div style={{...sCard,padding:"12px 16px",marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Dine butikker</div>
        {valgteButikker.length===0
          ? <div style={{fontSize:13.5,color:C.sub}}>Ingen butikker valgt ennå.</div>
          : <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {valgteButikker.map(b=>(
                <div key={b.id} style={{display:"flex",alignItems:"center",gap:5,background:C.bg,borderRadius:20,padding:"5px 10px"}}>
                  <div style={{width:8,height:8,borderRadius:4,background:KJEDER[b.kjede]?.farge||C.sub,flexShrink:0}}/>
                  <span style={{fontSize:12.5,fontWeight:600,color:C.text}}>{b.navn}</span>
                </div>
              ))}
              <button onClick={()=>onAapneSide({navn:"butikkRediger"})} style={{background:"none",border:`1px dashed ${C.border}`,borderRadius:20,padding:"5px 10px",fontSize:12.5,color:C.sub,cursor:"pointer"}}>Endre</button>
            </div>
        }
      </div>

      {/* ── Snarveger ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <button onClick={()=>onGaaTab("produkter")} style={{...sCard,padding:16,display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:"none",textAlign:"left"}}>
          <div style={{fontSize:26}}>🔍</div>
          <div>
            <div style={{fontSize:13.5,fontWeight:800,color:C.text}}>Finn produkter</div>
            <div style={{fontSize:11.5,color:C.sub}}>Søk og filtrer</div>
          </div>
        </button>
        <button onClick={()=>onGaaTab("kurv")} style={{...sCard,padding:16,display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:"none",textAlign:"left",position:"relative"}}>
          {antallIKurv>0 && <div style={{position:"absolute",top:10,right:10,background:C.err,color:"#fff",borderRadius:9,minWidth:18,height:18,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{antallIKurv}</div>}
          <div style={{fontSize:26}}>🛒</div>
          <div>
            <div style={{fontSize:13.5,fontWeight:800,color:C.text}}>Handlekurv</div>
            <div style={{fontSize:11.5,color:C.sub}}>{antallIKurv>0?`${antallIKurv} vare${antallIKurv!==1?"r":""}`:"Tom kurv"}</div>
          </div>
        </button>
        <button onClick={()=>onAapneSide({navn:"tilbud"})} style={{...sCard,padding:16,display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:"none",textAlign:"left"}}>
          <div style={{fontSize:26}}>🏷️</div>
          <div>
            <div style={{fontSize:13.5,fontWeight:800,color:C.text}}>Tilbud</div>
            <div style={{fontSize:11.5,color:C.sub}}>Rapporter og finn</div>
          </div>
        </button>
        <button onClick={()=>onGaaTab("kunnskap")} style={{...sCard,padding:16,display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:"none",textAlign:"left"}}>
          <div style={{fontSize:26}}>📚</div>
          <div>
            <div style={{fontSize:13.5,fontWeight:800,color:C.text}}>Kunnskap</div>
            <div style={{fontSize:11.5,color:C.sub}}>NOVA og ernæring</div>
          </div>
        </button>
      </div>

      {/* ── Hurtigsøk ── */}
      <div style={{...sCard,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>onGaaTab("produkter")}>
        {Ikon.sok(C.sub)}
        <span style={{fontSize:14,color:C.sub}}>Søk etter produkter…</span>
      </div>

      {/* ── Nylig sett ── */}
      {nyligSett?.length>0 && (
        <div style={{marginBottom:18}}>
          <h2 style={{fontSize:15,fontWeight:800,margin:"0 0 10px",color:C.text}}>👁 Nylig sett</h2>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
            {nyligSett.map(id=>{
              const v = VARER.find(x=>x.id===id);
              if(!v) return null;
              const best = bestePris(v.id, butikkIds);
              const ni = novaInfo(v.nova);
              return (
                <div key={id} onClick={()=>onAapne(v)} style={{...sCard,minWidth:110,maxWidth:130,padding:10,flexShrink:0,cursor:"pointer",borderTop:`3px solid ${ni.farge}`}}>
                  <ProduktBilde vare={v} str={36} style={{margin:"0 auto 6px"}}/>
                  <div style={{fontSize:11.5,fontWeight:700,color:C.text,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:4}}>{v.navn}</div>
                  {best && <div style={{fontSize:12.5,fontWeight:800,color:C.text}}>{best.pris.toFixed(2).replace(".",",")} kr</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dagens spare-tips ── */}
      {(()=>{
        const TIPS = [
          "Kyllingfilet er ofte 30–50% billigere per kilo enn ferdigkuttet kylling.",
          "Havre og gryn er blant de billigste proteinkildene per gram protein.",
          "Frossen fisk har ofte samme næringsinnhold som fersk – men lavere pris.",
          "Eggerøre er en av de billigste måltidene med høy proteinandel.",
          "Bønner og linser inneholder like mye protein som kjøtt, til en brøkdel av prisen.",
          "Å kjøpe hel kylling og dele den selv kan halvere prisen per kilo.",
          "Sesongfrukter og -grønnsaker er opp til 60% billigere enn utenfor sesong.",
          "Sjekk alltid kiloprisen – et «stort» pakk er ikke alltid billigst per kg.",
        ];
        const dagensIndex = new Date().getDate() % TIPS.length;
        return (
          <div style={{...sCard,padding:"14px 16px",marginBottom:16,borderLeft:`4px solid ${C.blue}`,background:C.blueLys}}>
            <div style={{fontSize:11,fontWeight:800,color:C.blue,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>💡 Dagens spare-tips</div>
            <div style={{fontSize:13.5,color:C.text,lineHeight:1.55}}>{TIPS[dagensIndex]}</div>
          </div>
        );
      })()}
      {ektePrisfall.length>0 && (
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h2 style={{fontSize:15,fontWeight:800,margin:0,color:C.text}}>💰 Dagens beste priser</h2>
            <button onClick={()=>onAapneSide({navn:"tilbud"})} style={{...lnk,fontSize:12.5}}>Se alle</button>
          </div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
            {ektePrisfall.slice(0,8).map((p,i)=>(
              <div key={p.ean||i} style={{...sCard,minWidth:130,maxWidth:150,padding:12,flexShrink:0,background:C.okLys,border:`1px solid ${C.ok}`}}>
                {p.bilde
                  ? <img src={p.bilde} style={{width:44,height:44,objectFit:"contain",margin:"0 auto 8px",display:"block"}} onError={e=>e.target.style.display="none"}/>
                  : <div style={{width:44,height:44,background:C.bg,borderRadius:8,margin:"0 auto 8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🛒</div>
                }
                <div style={{fontSize:12.5,fontWeight:700,color:C.text,lineHeight:1.3,marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.navn}</div>
                <div style={{fontSize:15,fontWeight:800,color:C.text}}>{p.prisNaa?.toFixed(2).replace(".",",")} kr</div>
                {p.kilopris && <div style={{fontSize:11,color:C.sub}}>{p.kilopris?.toFixed(2).replace(".",",")} kr/{p.vektEnhet==="ml"||p.vektEnhet==="l"?"l":"kg"}</div>}
                <div style={{fontSize:10.5,color:C.sub,marginTop:2}}>{p.butikk}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11.5,color:C.sub,marginTop:6}}>Ekte priser fra Kassalapp · Oppdateres hver time</div>
        </div>
      )}

      {/* ── Simulerte tilbud (fallback hvis ingen ekte data) ── */}
      {ektePrisfall.length===0 && besteKjop.length>0 && (
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h2 style={{fontSize:15,fontWeight:800,margin:0,color:C.text}}>🏷️ Tilbud akkurat nå</h2>
            <button onClick={()=>onGaaTab("produkter")} style={{...lnk,fontSize:12.5}}>Se alle</button>
          </div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
            {besteKjop.map(({vare,pris,butikkId,kilde,tid})=>{
              const b=SEED_BUTIKKER.find(x=>x.id===butikkId);
              return (
                <div key={vare.id} onClick={()=>onAapne(vare)} style={{...sCard,minWidth:130,maxWidth:150,padding:12,flexShrink:0,cursor:"pointer",border:`1px solid ${C.tilbudKant}`,background:"#fffef0"}}>
                  <ProduktBilde vare={vare} str={44} style={{margin:"0 auto 8px"}}/>
                  <div style={{fontSize:11,fontWeight:800,color:C.tilbudTekst,marginBottom:2}}>TILBUD</div>
                  <div style={{fontSize:12.5,fontWeight:700,color:C.text,lineHeight:1.3,marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{vare.navn}</div>
                  <div style={{fontSize:15,fontWeight:800,color:C.text}}>{pris.toFixed(2).replace(".",",")} kr</div>
                  <div style={{fontSize:11,color:C.sub,marginTop:2}}>{b?.navn}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Billig protein ── */}
      {billigProtein.length>0 && (
        <div style={{marginBottom:18}}>
          <h2 style={{fontSize:15,fontWeight:800,margin:"0 0 10px",color:C.text}}>💪 Beste protein per krone</h2>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {billigProtein.map(({vare,pris,prisPerGram,butikkId})=>{
              const b=SEED_BUTIKKER.find(x=>x.id===butikkId);
              const ni=novaInfo(vare.nova);
              return (
                <div key={vare.id} onClick={()=>onAapne(vare)} style={{...sCard,padding:"10px 14px",display:"flex",gap:10,alignItems:"center",cursor:"pointer",borderLeft:`3px solid ${ni.farge}`}}>
                  <ProduktBilde vare={vare} str={38}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vare.navn}</div>
                    <div style={{fontSize:12,color:C.sub}}>{vare.m?.protein}g protein · {b?.navn}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:C.text}}>{pris.toFixed(2).replace(".",",")} kr</div>
                    <div style={{fontSize:11,color:C.sub}}>{(prisPerGram).toFixed(2).replace(".",",")} kr/g</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Egne lister ── */}
      {lister.length>0 && (
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h2 style={{fontSize:15,fontWeight:800,margin:0,color:C.text}}>📋 Dine lister</h2>
            <button onClick={()=>onAapneSide({navn:"lister"})} style={{...lnk,fontSize:12.5}}>Se alle</button>
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
            {lister.slice(0,5).map(l=>(
              <div key={l.id} onClick={()=>onAapneSide({navn:"liste",liste:l})} style={{...sCard,minWidth:120,padding:"12px 14px",flexShrink:0,cursor:"pointer"}}>
                <div style={{fontSize:20,marginBottom:6}}>📋</div>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{l.navn}</div>
                <div style={{fontSize:11.5,color:C.sub}}>{l.varer?.length||0} varer</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ════ PRODUKTER-SIDE ════ */
function ProdukterSide({butikkIds, favoritter, pv, premium, onAapne, onLeggTil, onFavoritt}){
  const [sok,setSok] = useState("");
  const [kat,setKat] = useState(null);
  const [sorter,setSorter] = useState("relevans");
  const [novaMaks,setNovaMaks] = useState(0);
  const [visFilter,setVisFilter] = useState(false);
  const [sammenlignIds,setSammenlignIds] = useState([]);
  const [vissammenlign,setVisSammenlign] = useState(false);

  const toggleSammenlign = (id)=>{
    setSammenlignIds(prev=>{
      if(prev.includes(id)) return prev.filter(x=>x!==id);
      if(prev.length>=2) return [prev[1],id]; // maks 2, erstatt eldste
      return [...prev,id];
    });
  };

  const sammenlignVarer = sammenlignIds.map(id=>VARER.find(v=>v.id===id)).filter(Boolean);

  const liste = useMemo(()=>{
    let v = VARER;
    if(sok.trim()){
      const q = sok.trim().toLowerCase();
      // Synonymer og delvise treff
      const synonymer = {"cottage"🙁"cottage cheese","hytteost"],"hytteost"🙁"cottage cheese","cottage"],"melk"🙁"melk","drikk"],"filet"🙁"filet","filét"]};
      const ekstra = Object.entries(synonymer).filter(([k])=>q.includes(k)).flatMap(([,v])=>v);
      const alle = [q,...ekstra];
      v = v.filter(x=>alle.some(s=>x.navn.toLowerCase().includes(s)||x.prod.toLowerCase().includes(s)));
    }
    if(kat==="favoritter") v = v.filter(x=>favoritter.includes(x.id));
    else if(kat==="tilbud") v = v.filter(x=>erPaaTilbud(x.id,butikkIds));
    else if(kat) v = v.filter(x=>x.kat===kat);
    if(novaMaks>0) v = v.filter(x=>x.nova!=null && x.nova<=novaMaks);
    if(sorter==="prisLav"||sorter==="prisHoy"){
      v = [...v].sort((a,b)=>{
        const pa=bestePris(a.id,butikkIds)?.pris??Infinity, pb=bestePris(b.id,butikkIds)?.pris??Infinity;
        return sorter==="prisLav"?pa-pb:pb-pa;
      });
    } else if(sorter==="protein") v = [...v].sort((a,b)=>(b.m?.protein??-1)-(a.m?.protein??-1));
    else if(sorter==="kcal") v = [...v].sort((a,b)=>(a.m?.kcal??Infinity)-(b.m?.kcal??Infinity));
    else {
      // Standard: sorter produkter uten pris sist
      v = [...v].sort((a,b)=>{
        const harA = bestePris(a.id,butikkIds) ? 0 : 1;
        const harB = bestePris(b.id,butikkIds) ? 0 : 1;
        return harA - harB;
      });
    }
    return v;
  },[sok,kat,sorter,novaMaks,butikkIds,favoritter,pv]);

  const aktiveFiltre = (novaMaks>0?1:0)+(sorter!=="relevans"?1:0);

  return (
    <div style={{padding:"16px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:800,margin:"0 0 14px",color:C.text,letterSpacing:-0.4}}>Produkter</h1>
      <div style={{position:"relative",marginBottom:12}}>
        <div style={{position:"absolute",left:13,top:12}}>{Ikon.sok(C.sub)}</div>
        <input style={{...sInput,paddingLeft:44}} placeholder="Søk produkt eller merke …" value={sok} onChange={e=>setSok(e.target.value)}/>
      </div>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
        <button style={sChip(visFilter||aktiveFiltre>0)} onClick={()=>setVisFilter(v=>!v)}>⚙ Filter{aktiveFiltre>0?` (${aktiveFiltre})`:""}</button>
        {KAT.map(k=>(
          <button key={k.id} style={sChip(kat===k.id)} onClick={()=>setKat(p=>p===k.id?null:k.id)}>{k.navn}</button>
        ))}
      </div>
      {visFilter && (
        <div style={{...sCard,padding:14,marginBottom:12}}>
          <div style={{fontSize:12.5,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginBottom:8}}>Sorter etter</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
            {[["relevans","Relevans"],["prisLav","Pris lav–høy"],["prisHoy","Pris høy–lav"],["protein","Mest protein"],["kcal","Færrest kalorier"]].map(([id,n])=>(
              <button key={id} style={sChip(sorter===id)} onClick={()=>setSorter(id)}>{n}</button>
            ))}
          </div>
          <div style={{fontSize:12.5,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginBottom:8}}>Maks bearbeidingsgrad</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[[0,"Alle"],[1,"NOVA 1"],[2,"NOVA 1–2"],[3,"NOVA 1–3"]].map(([n,t])=>(
              <button key={n} style={sChip(novaMaks===n)} onClick={()=>setNovaMaks(n)}>{t}</button>
            ))}
          </div>
        </div>
      )}
      {!premium && (
        <div style={{...sCard,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10,background:"#FBFBFD"}}>
          <span style={{fontSize:9.5,fontWeight:800,color:C.sub,border:`1px solid ${C.border}`,borderRadius:5,padding:"2px 5px",letterSpacing:0.5}}>ANNONSE</span>
          <span style={{fontSize:12.5,color:C.sub,flex:1}}>Annonseplass · Premium fjerner all reklame</span>
        </div>
      )}
      <div style={{fontSize:12.5,color:C.sub,marginBottom:10}}>{liste.length} produkter</div>

      {/* Sammenlign-banner */}
      {sammenlignIds.length>0 && (
        <div style={{...sCard,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10,background:C.blueLys,border:`1px solid ${C.blue}`}}>
          <div style={{flex:1,fontSize:13,fontWeight:700,color:C.text}}>
            ⚖️ {sammenlignIds.length===1?"Velg ett produkt til å sammenligne":"Klar til å sammenligne!"}
          </div>
          {sammenlignIds.length===2 && (
            <button onClick={()=>setVisSammenlign(true)} style={{...sKnapp,padding:"8px 14px",fontSize:13,width:"auto"}}>
              Sammenlign
            </button>
          )}
          <button onClick={()=>setSammenlignIds([])} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:18,padding:4}}>✕</button>
        </div>
      )}

      {/* Sammenlign-modal */}
      {vissammenlign && sammenlignVarer.length===2 && (
        <div style={{position:"fixed",inset:0,background:"rgba(16,24,40,0.55)",zIndex:60,display:"flex",alignItems:"flex-end"}} onClick={()=>setVisSammenlign(false)}>
          <div style={{background:C.card,borderRadius:"18px 18px 0 0",padding:"20px 16px 32px",width:"100%",boxSizing:"border-box",maxHeight:"85vh",overflowY:"auto",animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{fontSize:17,fontWeight:800,margin:0,color:C.text}}>⚖️ Sammenligning</h3>
              <button onClick={()=>setVisSammenlign(false)} style={{background:"none",border:"none",fontSize:18,color:C.sub,cursor:"pointer"}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {sammenlignVarer.map(v=>{
                const best = bestePris(v.id, butikkIds);
                const ni = novaInfo(v.nova);
                const score = produktScore(v, butikkIds);
                return (
                  <div key={v.id} style={{...sCard,padding:14,borderTop:`4px solid ${ni.farge}`}}>
                    <ProduktBilde vare={v} str={56} style={{margin:"0 auto 10px"}}/>
                    <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:4,lineHeight:1.3}}>{v.navn}</div>
                    <div style={{fontSize:11.5,color:C.sub,marginBottom:8}}>{v.prod}</div>
                    {best && <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>{best.pris.toFixed(2).replace(".",",")} kr</div>}
                    {score!=null && (
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                        <span style={{fontSize:11.5,fontWeight:700,color:C.sub}}>Score</span>
                        <span style={{fontSize:15,fontWeight:800,color:score>=7?C.ok:score>=4?C.warn:C.err}}>{score.toFixed(1)}</span>
                      </div>
                    )}
                    {[
                      ["NOVA",v.nova?`${v.nova} – ${novaInfo(v.nova).tekst}`:"–"],
                      ["Protein",v.m?.protein!=null?`${v.m.protein}g`:"–"],
                      ["Kalorier",v.m?.kcal!=null?`${v.m.kcal} kcal`:"–"],
                      ["Fett",v.m?.fett!=null?`${v.m.fett}g`:"–"],
                      ["Karbo",v.m?.karbo!=null?`${v.m.karbo}g`:"–"],
                    ].map(([label,val])=>(
                      <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                        <span style={{fontSize:12,color:C.sub}}>{label}</span>
                        <span style={{fontSize:12,fontWeight:700,color:C.text}}>{val}</span>
                      </div>
                    ))}
                    <button onClick={()=>onLeggTil(v.id)} style={{...sKnapp,marginTop:12,padding:"9px 12px",fontSize:13}}>+ Kurv</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {liste.map(v=>(
          <ProduktKort key={v.id} vare={v} butikkIds={butikkIds} pv={pv}
            paaTilbud={erPaaTilbud(v.id,butikkIds)} favoritt={favoritter.includes(v.id)}
            onAapne={()=>onAapne(v)} onLeggTil={()=>onLeggTil(v.id)} onFavoritt={()=>onFavoritt(v.id)}
            onSammenlign={toggleSammenlign} sammenlignModus={sammenlignIds}/>
        ))}
        {liste.length===0 && (
          <div style={{...sCard,padding:28,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>🔍</div>
            <div style={{fontSize:14.5,fontWeight:700,color:C.text,marginBottom:4}}>Ingen treff</div>
            <div style={{fontSize:13,color:C.sub}}>Prøv et annet søkeord, eller fjern filtre.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════ HANDLEKURV-OPTIMALISERING ════
   Algoritme: for N valgte butikker, finn den kombinasjonen av butikker
   (opptil N) fra brukerens liste som minimerer totalkostnad, der hver
   vare kjøpes der den er billigst blant de valgte butikkene.
   Søkerom: C(|butikkIds|, k) for k=1..N → maks ~C(20,5)=15504, rask nok.
════ */
function kombiner(arr, k){
  if(k===0) return [[]];
  if(arr.length===0) return [];
  const [hode,...resten] = arr;
  return [...kombiner(resten,k-1).map(c=>[hode,...c]), ...kombiner(resten,k)];
}
function totalForKombinasjon(vareIds, antaller, butikkSubsett){
  let sum = 0, mangler = 0;
  const fordeling = {}; // vareId -> {butikkId, pris}
  for(const id of vareIds){
    let best = null;
    for(const bid of butikkSubsett){
      const p = prisMedFallback(id, bid);
      if(p && (!best || p.pris < best.pris)) best = {butikkId:bid, pris:p.pris, status:p.status};
    }
    if(best){ sum += best.pris * (antaller[id]||1); fordeling[id] = best; }
    else mangler++;
  }
  return { sum: Math.round(sum*100)/100, mangler, fordeling };
}
function optimalKombinasjon(vareIds, antaller, butikkIds, maxButikker){
  if(!butikkIds.length || !vareIds.length) return null;
  const k = Math.min(maxButikker, butikkIds.length);

  // Begrens til maks 12 butikker for ytelse – velg de 12 med lavest snittpris
  let kandidater = butikkIds;
  if(butikkIds.length > 12){
    const snitt = butikkIds.map(bid=>{
      const priser = vareIds.map(id=>{ const p=prisMedFallback(id,bid); return p?p.pris:999; });
      return { bid, snitt: priser.reduce((a,b)=>a+b,0)/priser.length };
    });
    snitt.sort((a,b)=>a.snitt-b.snitt);
    kandidater = snitt.slice(0,12).map(x=>x.bid);
  }

  let best = null;
  for(let n=1; n<=k; n++){
    const kombs = kombiner(kandidater, n);
    for(const komb of kombs){
      const res = totalForKombinasjon(vareIds, antaller, komb);
      if(!best || res.sum < best.sum - 0.001 ||
         (Math.abs(res.sum - best.sum) < 0.001 && komb.length < best.butikker.length)){
        best = {...res, butikker:komb};
      }
    }
  }
  return best;
}

/* ════ HANDLEKURV ════ */
function KurvSide({kurv, butikkIds, pv, onEndre, onAapne, maxButikker, setMaxButikker, onGaaTab}){
  const scrollRef = useRef(null);
  const scrollPos = useRef(0);

  const endreOgBevarScroll = (id, delta) => {
    scrollPos.current = scrollRef.current?.scrollTop || 0;
    onEndre(id, delta);
  };

  useEffect(()=>{
    if(scrollRef.current && scrollPos.current > 0){
      scrollRef.current.scrollTop = scrollPos.current;
    }
  });

  const varer = Object.entries(kurv).map(([id,antall])=>({vare:VARER.find(v=>v.id===id), antall})).filter(x=>x.vare);
  const vareIds = varer.map(x=>x.vare.id);
  const antaller = Object.fromEntries(varer.map(x=>[x.vare.id, x.antall]));

  // Beregn optimal fordeling for valgt antall butikker
  const optimal = useMemo(()=>
    varer.length ? optimalKombinasjon(vareIds, antaller, butikkIds, maxButikker) : null
  , [kurv, butikkIds, maxButikker, pv]);

  // Sammenligning av alle enkeltbutikker (én-butikk-scenario)
  const enButikkSamm = useMemo(()=>
    butikkIds.map(bid=>{
      const res = totalForKombinasjon(vareIds, antaller, [bid]);
      return {butikk: SEED_BUTIKKER.find(b=>b.id===bid), ...res};
    }).sort((a,b)=>a.sum-b.sum)
  , [kurv, butikkIds, pv]);

  // Besparelse mot billigste enkeltbutikk, nest beste, og dyreste
  const besparelser = useMemo(()=>{
    if(!optimal || !enButikkSamm.length) return null;
    const sortert = enButikkSamm.filter(s=>s.mangler===0 || s.sum>0).map(s=>s.sum).sort((a,b)=>a-b);
    if(!sortert.length) return null;
    const billigsteEn = sortert[0];
    const nestBeste = sortert.length>1 ? sortert[1] : null;
    const dyreste = sortert[sortert.length-1];
    return {
      vsBilligsteEn: Math.max(0, Math.round((billigsteEn - optimal.sum)*10)/10),
      vsNestBeste: nestBeste!=null ? Math.max(0, Math.round((nestBeste - optimal.sum)*10)/10) : null,
      vsDyreste: Math.max(0, Math.round((dyreste - optimal.sum)*10)/10),
    };
  }, [optimal, enButikkSamm]);

  if(!varer.length) return (
    <div style={{padding:"16px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:800,margin:"0 0 14px",color:C.text,letterSpacing:-0.4}}>Handlekurv</h1>
      <div style={{...sCard,padding:32,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🛒</div>
        <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:6}}>Handlekurven er tom</div>
        <div style={{fontSize:13.5,color:C.sub,lineHeight:1.6,marginBottom:20}}>
          Legg til produkter, så finner appen den billigste kombinasjonen av butikker for deg – og viser deg nøyaktig hvor mye du sparer.
        </div>
        <button onClick={()=>onGaaTab("produkter")} style={{...sKnapp,display:"inline-block",width:"auto",padding:"12px 28px"}}>
          Finn produkter
        </button>
      </div>
    </div>
  );

  const maxMulig = Math.min(butikkIds.length, 5);

  return (
    <div ref={scrollRef} style={{padding:"16px 16px 0",paddingBottom:120}}>
      <h1 style={{fontSize:24,fontWeight:800,margin:"0 0 14px",color:C.text,letterSpacing:-0.4}}>Handlekurv</h1>

      {/* ── Velg antall butikker ── */}
      {maxMulig > 1 && (
      <div style={{...sCard,padding:16,marginBottom:14}}>
        <div style={{fontSize:13.5,fontWeight:800,color:C.text,marginBottom:4}}>Hvor mange butikker vil du innom?</div>
        <div style={{fontSize:12.5,color:C.sub,marginBottom:12,lineHeight:1.5}}>
          Appen finner den kombinasjonen av butikker som gir lavest totalkostnad, og fordeler varene optimalt mellom dem.
        </div>
        <div style={{display:"flex",gap:8}}>
          {Array.from({length:maxMulig},(_,i)=>i+1).map(n=>(
            <button key={n} onClick={()=>setMaxButikker(n)} style={{
              flex:1,padding:"10px 4px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:800,fontSize:14,
              background:maxButikker===n?C.blue:C.bg, color:maxButikker===n?"#fff":C.sub,
              transition:"all .15s"
            }}>{n}</button>
          ))}
        </div>
        <div style={{fontSize:11.5,color:C.sub,marginTop:8,textAlign:"center"}}>
          {maxButikker===1?"Handel alt på én butikk":`Opptil ${maxButikker} butikker – appen velger den beste kombinasjonen`}
        </div>
      </div>
      )}

      {/* ── Optimal plan ── */}
      {optimal && (
        <div style={{...sCard,padding:18,marginBottom:14,border:`2px solid ${C.ok}`,background:C.okLys}}>
          <div style={{fontSize:11.5,fontWeight:800,color:C.ok,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>
            {optimal.butikker.length===1?"Beste enkeltbutikk":"Optimal fordeling"}
          </div>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{fontSize:22,fontWeight:800,color:C.text}}>{optimal.sum.toFixed(2).replace(".",",")} kr</span>
            {besparelser && besparelser.vsDyreste>0 && (
              <span style={{fontSize:13,fontWeight:700,color:C.ok}}>spar inntil {besparelser.vsDyreste.toFixed(2).replace(".",",")} kr</span>
            )}
          </div>
          {besparelser && (besparelser.vsNestBeste>0 || besparelser.vsDyreste>0) && (
            <div style={{display:"flex",flexDirection:"column",gap:2,marginTop:2,marginBottom:2}}>
              {besparelser.vsNestBeste!=null && besparelser.vsNestBeste>0 && (
                <span style={{fontSize:12,color:C.sub}}>↓ {besparelser.vsNestBeste.toFixed(2).replace(".",",")} kr vs. nest beste alternativ</span>
              )}
              {besparelser.vsDyreste>0 && (
                <span style={{fontSize:12,color:C.sub}}>↓ {besparelser.vsDyreste.toFixed(2).replace(".",",")} kr vs. dyreste alternativ</span>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
            {optimal.butikker.map(bid=>{
              const b = SEED_BUTIKKER.find(x=>x.id===bid);
              const varerHer = Object.entries(optimal.fordeling).filter(([,v])=>v.butikkId===bid);
              return (
                <div key={bid} style={{background:"#fff",borderRadius:10,padding:"10px 14px",border:`1px solid ${C.border}`,flex:"1 1 140px",minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                    <div style={{width:8,height:8,borderRadius:4,background:KJEDER[b?.kjede]?.farge||C.sub,flexShrink:0}}/>
                    <span style={{fontSize:12.5,fontWeight:800,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b?.navn||bid}</span>
                  </div>
                  <div style={{fontSize:11.5,color:C.sub,lineHeight:1.6}}>
                    {varerHer.length} vare{varerHer.length!==1?"r":""}<br/>
                    {varerHer.reduce((s,[id,v])=>s+v.pris*(antaller[id]||1),0).toFixed(2).replace(".",",")} kr
                  </div>
                </div>
              );
            })}
          </div>
          {optimal.mangler>0 && <div style={{fontSize:12,color:C.warn,marginTop:8}}>⚠ {optimal.mangler} vare{optimal.mangler>1?"r":""} mangler prisdata og er ikke medregnet.</div>}
        </div>
      )}

      {/* ── Fordeling per vare ── */}
      {optimal && optimal.butikker.length>1 && (
        <div style={{...sCard,padding:16,marginBottom:14}}>
          <h3 style={{fontSize:13.5,fontWeight:800,margin:"0 0 10px",color:C.text}}>Handleliste per butikk</h3>
          {optimal.butikker.map(bid=>{
            const b = SEED_BUTIKKER.find(x=>x.id===bid);
            const varerHer = varer.filter(({vare})=>optimal.fordeling[vare.id]?.butikkId===bid);
            if(!varerHer.length) return null;
            return (
              <div key={bid} style={{marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:8,height:8,borderRadius:4,background:KJEDER[b?.kjede]?.farge||C.sub}}/>
                  <span style={{fontSize:13,fontWeight:800,color:C.text}}>{b?.navn||bid}</span>
                </div>
                {varerHer.map(({vare,antall})=>{
                  const fd = optimal.fordeling[vare.id];
                  return (
                    <div key={vare.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                      <ProduktBilde vare={vare} str={32}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vare.navn}</div>
                        <div style={{fontSize:11.5,color:C.sub,display:"flex",alignItems:"center",gap:4}}><Prikk kilde={fd?.kilde||"simulert"} tid={fd?.tid||0}/>{fd?.pris?.toFixed(2).replace(".",",")} kr × {antall}</div>
                      </div>
                      <span style={{fontSize:13.5,fontWeight:800,color:C.text}}>{((fd?.pris||0)*antall).toFixed(2).replace(".",",")} kr</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Enkeltbutikk-sammenligning – vis kun hvis 1 butikk er valgt ── */}
      {maxButikker === 1 && (
      <div style={{...sCard,padding:16,marginBottom:14}}>
        <h3 style={{fontSize:13.5,fontWeight:800,margin:"0 0 4px",color:C.text}}>Sammenligning av dine butikker</h3>
        <p style={{fontSize:12,color:C.sub,margin:"0 0 10px",lineHeight:1.5}}>Sortert fra billigst til dyrest for hele handlekurven din.</p>
        {enButikkSamm.map((s,i)=>(
          <div key={s.butikk.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<enButikkSamm.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{width:10,height:10,borderRadius:5,background:KJEDER[s.butikk.kjede]?.farge||C.sub,flexShrink:0}}/>
            <span style={{fontSize:13.5,fontWeight:i===0?800:600,color:C.text,flex:1}}>{s.butikk.navn}</span>
            {i===0 && <span style={{fontSize:10.5,fontWeight:800,color:C.ok}}>BILLIGST</span>}
            {s.mangler>0 && <span style={{fontSize:10.5,color:C.warn}}>{s.mangler} mangler</span>}
            <span style={{fontSize:14,fontWeight:800,color:i===0?C.ok:C.text}}>{s.sum.toFixed(2).replace(".",",")} kr</span>
          </div>
        ))}
      </div>
      )}

      {/* ── Vareliste med kvantitetskontroll ── */}
      <h3 style={{fontSize:13.5,fontWeight:800,margin:"0 0 8px",color:C.text}}>Varer ({varer.reduce((s,x)=>s+x.antall,0)})</h3>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {varer.map(({vare,antall})=>{
          const bid = optimal?.fordeling?.[vare.id]?.butikkId;
          const butikk = bid ? SEED_BUTIKKER.find(b=>b.id===bid) : null;
          const p = bid ? prisMedFallback(vare.id,bid) : null;
          return (
            <div key={vare.id} style={{...sCard,padding:"12px 14px",display:"flex",gap:12,alignItems:"center"}}>
              <ProduktBilde vare={vare} str={44}/>
              <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>onAapne(vare)}>
                <div style={{fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vare.navn}</div>
                {butikk && <div style={{fontSize:11.5,color:C.sub,display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                  <div style={{width:6,height:6,borderRadius:3,background:KJEDER[butikk.kjede]?.farge||C.sub}}/>
                  {butikk.navn} · {p?.pris?.toFixed(2).replace(".",",")} kr
                </div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>endreOgBevarScroll(vare.id,-1)} style={{width:30,height:30,borderRadius:15,border:`1px solid ${C.border}`,background:"#fff",fontSize:17,fontWeight:700,cursor:"pointer",color:C.text,lineHeight:1}}>−</button>
                <span style={{fontSize:14.5,fontWeight:800,color:C.text,minWidth:18,textAlign:"center"}}>{antall}</span>
                <button onClick={()=>endreOgBevarScroll(vare.id,1)} style={{width:30,height:30,borderRadius:15,border:"none",background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{Ikon.pluss()}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════ KUNNSKAP ════ */
function KunnskapSide({onAapneArtikkel}){
  const emner = [...new Set(ARTIKLER_SEED.map(a=>a.emne))];
  return (
    <div style={{padding:"16px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:800,margin:"0 0 4px",color:C.text,letterSpacing:-0.4}}>Kunnskap</h1>
      <p style={{fontSize:13.5,color:C.sub,margin:"0 0 16px",lineHeight:1.5}}>Lær å forstå maten og prisene – ta smartere valg i butikken.</p>

      {/* Visuell NOVA-intro */}
      <div style={{...sCard,padding:16,marginBottom:20}}>
        <div style={{fontSize:13.5,fontWeight:800,color:C.text,marginBottom:2}}>🥦 NOVA – hva betyr det?</div>
        <p style={{fontSize:12.5,color:C.sub,margin:"0 0 12px",lineHeight:1.5}}>NOVA er et system som deler mat inn i 4 grupper basert på hvor mye den er bearbeidet industrielt.</p>
        {[
          {nova:1,eksempel:"Frukt, grønnsaker, egg, kjøtt, melk"},
          {nova:2,eksempel:"Smør, olje, mel, sukker, salt"},
          {nova:3,eksempel:"Hermetikk, ost, spekemat, brød"},
          {nova:4,eksempel:"Brus, chips, pølser, hurtigmat"},
        ].map(({nova,eksempel})=>{
          const ni = novaInfo(nova);
          return (
            <div key={nova} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:32,height:32,borderRadius:8,background:ni.farge,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#fff",fontWeight:800,fontSize:13}}>
                {nova}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:C.text}}>{ni.tekst}</div>
                <div style={{fontSize:12,color:C.sub,lineHeight:1.4}}>{eksempel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {emner.map(emne=>(
        <div key={emne} style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginBottom:8}}>{emne}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ARTIKLER_SEED.filter(a=>a.emne===emne).map(a=>(
              <button key={a.id} onClick={()=>onAapneArtikkel(a)} style={{...sCard,padding:"14px 16px",display:"flex",gap:12,alignItems:"center",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:24}}>{a.ikon}</span>
                <span style={{fontSize:14.5,fontWeight:700,color:C.text,flex:1}}>{a.tittel}</span>
                <span style={{color:C.sub,fontSize:18}}>›</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
function ArtikkelVisning({artikkel, onTilbake}){
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:"-apple-system,'Segoe UI',Roboto,sans-serif"}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:5}}>
        <button onClick={onTilbake} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>{Ikon.tilbake()}</button>
        <span style={{fontSize:13,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4}}>{artikkel.emne}</span>
      </div>
      <div style={{padding:"22px 20px"}}>
        <div style={{fontSize:38,marginBottom:10}}>{artikkel.ikon}</div>
        <h1 style={{fontSize:23,fontWeight:800,margin:"0 0 16px",color:C.text,lineHeight:1.25,letterSpacing:-0.4}}>{artikkel.tittel}</h1>
        {artikkel.innhold.split("\n\n").map((avsnitt,i)=>(
          <p key={i} style={{fontSize:15,color:C.text,lineHeight:1.65,margin:"0 0 14px"}}>{avsnitt}</p>
        ))}
      </div>
    </div>
  );
}

/* ════ UNDERSIDE-RAMME ════ */
function UnderHeader({tittel, onTilbake, hoyre}){
  return (
    <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:5}}>
      <button onClick={onTilbake} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>{Ikon.tilbake()}</button>
      <span style={{fontSize:16,fontWeight:800,color:C.text,flex:1}}>{tittel}</span>
      {hoyre}
    </div>
  );
}
function Felt({label, type, verdi, onEndre, plassholder}){
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>{label}</div>
      <input style={sInput} type={type||"text"} value={verdi} placeholder={plassholder||""} onChange={e=>onEndre(e.target.value)}/>
    </div>
  );
}
function FeilBoks({tekst}){
  if(!tekst) return null;
  return <div style={{background:C.errLys,color:C.err,borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:600,marginBottom:12,lineHeight:1.45}}>{tekst}</div>;
}
function InfoBoks({tekst}){
  if(!tekst) return null;
  return <div style={{background:C.blueLys,color:C.blue,borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:600,marginBottom:12,lineHeight:1.45}}>{tekst}</div>;
}

/* ════ FAVORITTER ════ */
function FavoritterSide({favoritter, butikkIds, pv, onTilbake, onAapne, onLeggTil, onFavoritt, onLeggAlleIKurv}){
  const varer = VARER.filter(v=>favoritter.includes(v.id));
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:varer.length>0?90:40,fontFamily:FONT}}>
      <UnderHeader tittel="Favoritter" onTilbake={onTilbake}/>
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {varer.length===0 ? (
          <div style={{...sCard,padding:32,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>⭐</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>Ingen favoritter ennå</div>
            <div style={{fontSize:13.5,color:C.sub,lineHeight:1.5}}>Trykk på stjernen på et produkt for å samle favorittene dine her.</div>
          </div>
        ) : varer.map(v=>(
          <ProduktKort key={v.id} vare={v} butikkIds={butikkIds} pv={pv}
            paaTilbud={erPaaTilbud(v.id,butikkIds)} favoritt
            onAapne={()=>onAapne(v)} onLeggTil={()=>onLeggTil(v.id)} onFavoritt={()=>onFavoritt(v.id)}/>
        ))}
      </div>
      {varer.length>0 && (
        <div style={{position:"fixed",left:0,right:0,bottom:0,padding:"12px 16px 22px",background:C.card,borderTop:`1px solid ${C.border}`}}>
          <button style={sKnapp} onClick={()=>onLeggAlleIKurv(varer.map(v=>v.id))}>
            Legg alle {varer.length} favoritter i handlekurven
          </button>
        </div>
      )}
    </div>
  );
}

/* ════ LISTER ════ */
function NyListeModal({brukteNavn, onOpprett, onLukk}){
  const [navn,setNavn] = useState("");
  const forslag = LISTE_FORSLAG.filter(f=>!brukteNavn.includes(f));
  const gyldig = navn.trim().length>0;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(16,24,40,0.45)",zIndex:60,display:"flex",alignItems:"flex-end"}} onClick={onLukk}>
      <div style={{background:C.card,borderRadius:"18px 18px 0 0",padding:"20px 20px 28px",width:"100%",boxSizing:"border-box",animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
        <h3 style={{fontSize:17,fontWeight:800,margin:"0 0 14px",color:C.text}}>Ny liste</h3>
        <input style={{...sInput,marginBottom:12}} placeholder="Navn på listen" value={navn} onChange={e=>setNavn(e.target.value)} autoFocus/>
        {forslag.length>0 && (
          <>
            <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:8}}>Forslag</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
              {forslag.map(f=><button key={f} style={sChip(navn===f)} onClick={()=>setNavn(f)}>{f}</button>)}
            </div>
          </>
        )}
        <button style={{...sKnapp,opacity:gyldig?1:0.4}} disabled={!gyldig} onClick={()=>onOpprett(navn.trim())}>Opprett liste</button>
        <button style={{...sKnappSek,marginTop:8}} onClick={onLukk}>Avbryt</button>
      </div>
    </div>
  );
}
function ListeVelgerModal({vare, lister, onVelg, onNy, onLukk}){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(16,24,40,0.45)",zIndex:60,display:"flex",alignItems:"flex-end"}} onClick={onLukk}>
      <div style={{background:C.card,borderRadius:"18px 18px 0 0",padding:"20px 20px 28px",width:"100%",boxSizing:"border-box",maxHeight:"70vh",overflowY:"auto",animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
        <h3 style={{fontSize:17,fontWeight:800,margin:"0 0 4px",color:C.text}}>Legg i liste</h3>
        <p style={{fontSize:13,color:C.sub,margin:"0 0 14px"}}>{vare.navn}</p>
        {lister.length===0 && <p style={{fontSize:13.5,color:C.sub,margin:"0 0 12px"}}>Du har ingen lister ennå – opprett din første under.</p>}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          {lister.map(l=>{
            const harVaren = l.varer.includes(vare.id);
            return (
              <button key={l.id} onClick={()=>onVelg(l.id)} style={{...sCard,padding:"13px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
                {Ikon.liste(C.blue)}
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text}}>{l.navn}</div>
                  <div style={{fontSize:12,color:C.sub}}>{l.varer.length} varer{harVaren?" · inneholder varen allerede":""}</div>
                </div>
                {harVaren && <span style={{color:C.ok}}>{Ikon.sjekk(C.ok)}</span>}
              </button>
            );
          })}
        </div>
        <button style={sKnapp} onClick={onNy}>+ Ny liste</button>
        <button style={{...sKnappSek,marginTop:8}} onClick={onLukk}>Avbryt</button>
      </div>
    </div>
  );
}
function ListerSide({lister, onTilbake, onAapneListe, onNyListe}){
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Mine lister" onTilbake={onTilbake} hoyre={<button style={lnk} onClick={onNyListe}>+ Ny liste</button>}/>
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {lister.length===0 ? (
          <div style={{...sCard,padding:32,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>📋</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>Ingen lister ennå</div>
            <div style={{fontSize:13.5,color:C.sub,lineHeight:1.5,marginBottom:16}}>Samle varer i egne lister – for ukehandelen, middager eller treningsmat.</div>
            <button style={sKnapp} onClick={onNyListe}>Opprett din første liste</button>
          </div>
        ) : lister.map(l=>(
          <button key={l.id} onClick={()=>onAapneListe(l.id)} style={{...sCard,padding:"15px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left"}}>
            {Ikon.liste(C.blue)}
            <div style={{flex:1}}>
              <div style={{fontSize:14.5,fontWeight:700,color:C.text}}>{l.navn}</div>
              <div style={{fontSize:12.5,color:C.sub}}>{l.varer.length} varer</div>
            </div>
            <span style={{color:C.sub,fontSize:18}}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function ListeDetalj({liste, butikkIds, onTilbake, onEndreNavn, onSlett, onFjern, onAapne, onAltIKurv}){
  const [redigerer,setRedigerer] = useState(false);
  const [navn,setNavn] = useState(liste.navn);
  const [bekreftSlett,setBekreftSlett] = useState(false);
  const varer = liste.varer.map(id=>VARER.find(v=>v.id===id)).filter(Boolean);
  const total = varer.reduce((sum,v)=>{ const p=bestePris(v.id,butikkIds); return p?sum+p.pris:sum; },0);

  const delListe = ()=>{
    const linjer = [`📋 ${liste.navn}\n`];
    // Grupper per butikk
    const perButikk = {};
    varer.forEach(v=>{
      const best = bestePris(v.id,butikkIds);
      const butikkNavn = best ? (SEED_BUTIKKER.find(b=>b.id===best.butikkId)?.navn||"Ukjent") : "Ingen pris";
      if(!perButikk[butikkNavn]) perButikk[butikkNavn]=[];
      perButikk[butikkNavn].push(• ${v.navn}${best? – ${best.pris.toFixed(2).replace(".",",")} kr`:""}`);
    });
    Object.entries(perButikk).forEach(([butikk,varer])=>{
      linjer.push\n🏪 ${butikk}`);
      varer.forEach(v=>linjer.push(v));
    });
    linjer.push(\nTotalt: ca. ${total.toFixed(0)} kr);
    linjer.push(\nLaget med Matpilot);
    const tekst = linjer.join("\n");
    if(navigator.share){ navigator.share({title:liste.navn,text:tekst}).catch(()=>{}); }
    else if(navigator.clipboard){ navigator.clipboard.writeText(tekst).then(()=>alert("Kopiert til utklippstavlen!")); }
    else { alert(tekst); }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:110,fontFamily:FONT}}>
      <UnderHeader tittel={liste.navn} onTilbake={onTilbake}/>
      <div style={{padding:16}}>

        {/* Totalbudsjett */}
        {varer.length>0 && total>0 && (
          <div style={{...sCard,padding:16,marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginBottom:2}}>Estimert totalsum</div>
              <div style={{fontSize:26,fontWeight:800,color:C.ok,letterSpacing:-0.5}}>{total.toFixed(2).replace(".",",")} kr</div>
              <div style={{fontSize:11.5,color:C.sub}}>beste pris i dine butikker · {varer.length} varer</div>
            </div>
            <button onClick={delListe} style={{...sKnappSek,width:"auto",padding:"10px 14px",fontSize:13,flexShrink:0}}>
              📤 Del
            </button>
          </div>
        )}

        <div style={{...sCard,padding:14,marginBottom:12,display:"flex",gap:8}}>
          <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13}} onClick={()=>{setNavn(liste.navn);setRedigerer(true);}}>Gi nytt navn</button>
          <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13,color:C.err}} onClick={()=>setBekreftSlett(true)}>Slett liste</button>
        </div>
        {redigerer && (
          <div style={{...sCard,padding:14,marginBottom:12}}>
            <input style={{...sInput,marginBottom:10}} value={navn} onChange={e=>setNavn(e.target.value)} autoFocus/>
            <div style={{display:"flex",gap:8}}>
              <button style={{...sKnapp,width:"auto",flex:1,padding:"10px 12px",fontSize:13,opacity:navn.trim()?1:0.4}} disabled={!navn.trim()} onClick={()=>{onEndreNavn(navn.trim());setRedigerer(false);}}>Lagre navn</button>
              <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13}} onClick={()=>setRedigerer(false)}>Avbryt</button>
            </div>
          </div>
        )}
        {bekreftSlett && (
          <div style={{...sCard,padding:14,marginBottom:12,border:`1px solid ${C.err}`}}>
            <div style={{fontSize:13.5,fontWeight:700,color:C.text,marginBottom:10}}>Slette «{liste.navn}»? Dette kan ikke angres.</div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...sKnapp,width:"auto",flex:1,padding:"10px 12px",fontSize:13,background:C.err}} onClick={onSlett}>Ja, slett listen</button>
              <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13}} onClick={()=>setBekreftSlett(false)}>Avbryt</button>
            </div>
          </div>
        )}
        {varer.length===0 ? (
          <div style={{...sCard,padding:32,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>📋</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>Listen er tom</div>
            <div style={{fontSize:13.5,color:C.sub,lineHeight:1.5}}>Åpne et produkt og trykk «Legg i liste» for å fylle den.</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {varer.map(v=>{
              const best = bestePris(v.id,butikkIds);
              return (
                <div key={v.id} style={{...sCard,padding:"12px 14px",display:"flex",gap:12,alignItems:"center"}}>
                  <ProduktBilde vare={v} str={44}/>
                  <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>onAapne(v)}>
                    <div style={{fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.navn}</div>
                    <div style={{fontSize:12.5,color:C.sub}}>{best?`fra ${best.pris.toFixed(2).replace(".",",")} kr`:"Pris mangler"}</div>
                  </div>
                  <button onClick={()=>onFjern(v.id)} style={{background:"none",border:"none",color:C.err,fontSize:13,fontWeight:700,cursor:"pointer"}}>Fjern</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {varer.length>0 && (
        <div style={{position:"fixed",left:0,right:0,bottom:0,padding:"12px 16px 22px",background:C.card,borderTop:`1px solid ${C.border}`}}>
          <button style={sKnapp} onClick={onAltIKurv}>Legg alle {varer.length} varene i handlekurven</button>
        </div>
      )}
    </div>
  );
}

/* ════ MINE BUTIKKER ════ */
function MineButikkerSide({butikkIds, onLagre, onTilbake}){
  const [valg,setValg] = useState(butikkIds);
  const toggle = (id)=>setValg(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:110,fontFamily:FONT}}>
      <UnderHeader tittel="Mine butikker" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <p style={{fontSize:13.5,color:C.sub,margin:"0 0 16px",lineHeight:1.5}}>Velg butikkene som er aktuelle for deg. Handlekurv-sammenligningen bruker kun disse.</p>
        {(()=>{
          const steder = [...new Set(SEED_BUTIKKER.map(b=>b.sted))].sort();
          return steder.map(sted=>{
            const bs = SEED_BUTIKKER.filter(b=>b.sted===sted && kjeder.some(k=>k===b.kjede));
            if(!bs.length) return null;
            return (
              <div key={sted} style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{sted}</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {bs.map(b=>{
                    const v = valg.includes(b.id);
                    return (
                      <button key={b.id} onClick={()=>toggle(b.id)} style={{...sCard,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:v?`2px solid ${C.blue}`:`1px solid ${C.border}`,background:v?C.blueLys:"#fff",textAlign:"left"}}>
                        <div style={{width:8,height:8,borderRadius:4,background:KJEDER[b.kjede]?.farge||C.sub,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13.5,fontWeight:700,color:C.text}}>{b.navn}</div>
                          <div style={{fontSize:11.5,color:C.sub}}>{b.adresse}</div>
                        </div>
                        <div style={{width:20,height:20,borderRadius:10,border:v?"none":`2px solid ${C.border}`,background:v?C.blue:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {v && Ikon.sjekk()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>
      <div style={{position:"fixed",left:0,right:0,bottom:0,padding:"12px 16px 22px",background:C.card,borderTop:`1px solid ${C.border}`}}>
        <button style={{...sKnapp,opacity:valg.length?1:0.4}} disabled={!valg.length} onClick={()=>onLagre(valg)}>Lagre butikkvalg ({valg.length})</button>
      </div>
    </div>
  );
}

/* ════ KONTO (simulert autentisering) ════ */
function KontoSide({onTilbake, onLoggInn, onRegistrer, onNyttPassord, finnesEpost}){
  const [modus,setModus] = useState("inn"); // inn | ny | glemt
  const [navn,setNavn] = useState(""); const [epost,setEpost] = useState(""); const [passord,setPassord] = useState("");
  const [feil,setFeil] = useState(null); const [info,setInfo] = useState(null);
  const [glemtSteg,setGlemtSteg] = useState(0); const [kode,setKode] = useState(""); const [riktigKode,setRiktigKode] = useState(null);

  const bytt = (m)=>{ setModus(m); setFeil(null); setInfo(null); setGlemtSteg(0); setKode(""); setPassord(""); };
  const epostOk = (e)=>e.includes("@") && e.includes(".");

  const sendInn = ()=>{
    setFeil(null);
    if(modus==="inn"){
      if(!epostOk(epost)) return setFeil("Skriv inn en gyldig e-postadresse.");
      const f = onLoggInn(epost.trim().toLowerCase(), passord);
      if(f) setFeil(f);
    } else if(modus==="ny"){
      if(!navn.trim()) return setFeil("Skriv inn navnet ditt.");
      if(!epostOk(epost)) return setFeil("Skriv inn en gyldig e-postadresse.");
      if(passord.length<6) return setFeil("Passordet må ha minst 6 tegn.");
      const f = onRegistrer(navn.trim(), epost.trim().toLowerCase(), passord);
      if(f) setFeil(f);
    } else if(modus==="glemt"){
      if(glemtSteg===0){
        if(!epostOk(epost)) return setFeil("Skriv inn en gyldig e-postadresse.");
        if(!finnesEpost(epost.trim().toLowerCase())) return setFeil("Fant ingen konto med denne e-postadressen.");
        const k = String(100000 + (hash(epost.trim().toLowerCase())%900000));
        setRiktigKode(k);
        setInfo(Demoversjon: tilbakestillingskoden din er ${k}. I en lansert app sendes denne på e-post.);
        setGlemtSteg(1);
      } else {
        if(kode!==riktigKode) return setFeil("Koden stemmer ikke. Sjekk og prøv igjen.");
        if(passord.length<6) return setFeil("Det nye passordet må ha minst 6 tegn.");
        onNyttPassord(epost.trim().toLowerCase(), passord);
        bytt("inn");
        setInfo("Passordet er oppdatert. Logg inn med det nye passordet.");
      }
    }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT}}>
      <UnderHeader tittel={modus==="inn"?"Logg inn":modus==="ny"?"Opprett konto":"Tilbakestill passord"} onTilbake={onTilbake}/>
      <div style={{padding:"24px 20px"}}>
        <FeilBoks tekst={feil}/>
        <InfoBoks tekst={info}/>
        {modus==="ny" && <Felt label="Navn" verdi={navn} onEndre={setNavn} plassholder="Fornavn Etternavn"/>}
        {(modus!=="glemt" || glemtSteg===0) && <Felt label="E-post" type="email" verdi={epost} onEndre={setEpost} plassholder="deg@eksempel.no"/>}
        {modus==="glemt" && glemtSteg===1 && <Felt label="Tilbakestillingskode" verdi={kode} onEndre={setKode} plassholder="6 siffer"/>}
        {(modus!=="glemt" || glemtSteg===1) && <Felt label={modus==="glemt"?"Nytt passord":"Passord"} type="password" verdi={passord} onEndre={setPassord} plassholder="Minst 6 tegn"/>}
        <button style={{...sKnapp,marginTop:6}} onClick={sendInn}>
          {modus==="inn"?"Logg inn":modus==="ny"?"Opprett konto":glemtSteg===0?"Send tilbakestillingskode":"Lagre nytt passord"}
        </button>
        <div style={{display:"flex",flexDirection:"column",gap:12,alignItems:"center",marginTop:22}}>
          {modus!=="inn" && <button style={lnk} onClick={()=>bytt("inn")}>Har du konto? Logg inn</button>}
          {modus!=="ny" && <button style={lnk} onClick={()=>bytt("ny")}>Ny her? Opprett konto</button>}
          {modus==="inn" && <button style={lnk} onClick={()=>bytt("glemt")}>Glemt passordet?</button>}
        </div>
        <p style={{fontSize:12,color:C.sub,textAlign:"center",marginTop:26,lineHeight:1.5}}>Dette er en demoversjon: kontoen lagres lokalt på denne enheten. I en lansert app håndteres innlogging av en sikker server.</p>
      </div>
    </div>
  );
}
function ProfilRedigerSide({bruker, onLagre, onTilbake}){
  const [navn,setNavn] = useState(bruker.navn);
  const [epost,setEpost] = useState(bruker.epost);
  const [feil,setFeil] = useState(null);
  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT}}>
      <UnderHeader tittel="Rediger profil" onTilbake={onTilbake}/>
      <div style={{padding:"24px 20px"}}>
        <FeilBoks tekst={feil}/>
        <Felt label="Navn" verdi={navn} onEndre={setNavn}/>
        <Felt label="E-post" type="email" verdi={epost} onEndre={setEpost}/>
        <button style={{...sKnapp,marginTop:6}} onClick={()=>{
          if(!navn.trim()) return setFeil("Navnet kan ikke være tomt.");
          if(!epost.includes("@")) return setFeil("Skriv inn en gyldig e-postadresse.");
          const f = onLagre(navn.trim(), epost.trim().toLowerCase());
          if(f) setFeil(f);
        }}>Lagre endringer</button>
      </div>
    </div>
  );
}

/* ════ PRISRAPPORTERING ════ */
function RapporterPrisModal({vare, butikkIds, onSend, onLukk}){
  const [butikkId,setButikkId] = useState(butikkIds[0]||SEED_BUTIKKER[0].id);
  const [pris,setPris] = useState("");
  const [erTilbud,setErTilbud] = useState(false);
  const [tilbudFrist,setTilbudFrist] = useState("");
  const [bildeNavn,setBildeNavn] = useState(null);
  const tall = parseFloat(String(pris).replace(",","."));
  const gyldig = !isNaN(tall) && tall>0 && tall<10000;
  const mine = SEED_BUTIKKER.filter(b=>butikkIds.includes(b.id));
  const andre = SEED_BUTIKKER.filter(b=>!butikkIds.includes(b.id));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(16,24,40,0.45)",zIndex:60,display:"flex",alignItems:"flex-end"}} onClick={onLukk}>
      <div style={{background:C.card,borderRadius:"18px 18px 0 0",padding:"20px 20px 28px",width:"100%",boxSizing:"border-box",maxHeight:"85vh",overflowY:"auto",animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
        <h3 style={{fontSize:17,fontWeight:800,margin:"0 0 4px",color:C.text}}>Rapporter pris</h3>
        <p style={{fontSize:13,color:C.sub,margin:"0 0 14px"}}>{vare.navn} · {vare.prod}</p>

        <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Butikk</div>
        <select value={butikkId} onChange={e=>setButikkId(e.target.value)} style={{...sInput,marginBottom:12,appearance:"auto"}}>
          <optgroup label="Dine butikker">
            {mine.map(b=><option key={b.id} value={b.id}>{b.navn}</option>)}
          </optgroup>
          <optgroup label="Andre butikker">
            {andre.map(b=><option key={b.id} value={b.id}>{b.navn}</option>)}
          </optgroup>
        </select>

        <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Pris (kr)</div>
        <input style={{...sInput,marginBottom:12}} inputMode="decimal" placeholder="f.eks. 32,90" value={pris} onChange={e=>setPris(e.target.value)}/>

        {/* Tilbuds-toggle */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:erTilbud?"#fffdf0":C.bg,borderRadius:12,marginBottom:erTilbud?10:12,border:erTilbud?`1px solid ${C.gull}`:`1px solid ${C.border}`}}>
          <div style={{flex:1}}>
            <div style={{fontSize:13.5,fontWeight:700,color:C.text}}>🏷️ Dette er et tilbud</div>
            <div style={{fontSize:12,color:C.sub}}>Gi ekstra +15 XP og vis det på hjemskjermen</div>
          </div>
          <button onClick={()=>setErTilbud(v=>!v)} style={{width:46,height:26,borderRadius:13,border:"none",cursor:"pointer",background:erTilbud?C.gull:C.border,position:"relative",flexShrink:0}}>
            <span style={{position:"absolute",top:3,left:erTilbud?23:3,width:20,height:20,borderRadius:10,background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </button>
        </div>

        {erTilbud && (
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Tilbud gjelder til (valgfritt)</div>
            <input type="date" style={{...sInput}} value={tilbudFrist} onChange={e=>setTilbudFrist(e.target.value)}/>
          </div>
        )}

        <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Bildebevis (valgfritt, +15 XP ekstra)</div>
        <label style={{...sKnappSek,display:"block",textAlign:"center",marginBottom:12,boxSizing:"border-box"}}>
          {bildeNavn ? ✓ ${bildeNavn} : "Legg ved bilde av hylleprisen"}
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>setBildeNavn(e.target.files?.[0]?.name||null)}/>
        </label>
        <p style={{fontSize:12,color:C.sub,margin:"0 0 14px",lineHeight:1.5}}>Tidspunktet registreres automatisk. Nye priser merkes som estimerte til de bekreftes. I demoversjonen lagres ikke selve bildet.</p>
        <button style={{...sKnapp,opacity:gyldig?1:0.4}} disabled={!gyldig} onClick={()=>onSend({butikkId,pris:Math.round(tall*100)/100,bilde:!!bildeNavn,erTilbud,tilbudFrist:tilbudFrist||null})}>
          Send {erTilbud?"tilbudsrapport":"prisrapport"} (+{10+(bildeNavn?15:0)+(erTilbud?15:0)} XP)
        </button>
        <button style={{...sKnappSek,marginTop:8}} onClick={onLukk}>Avbryt</button>
      </div>
    </div>
  );
}

/* ════ TILBUDSSIDE ════ */
function TilbudsSide({butikkIds, rapporter, pv, onAapne, onLeggTil, onTilbake}){
  const [filter, setFilter] = useState("alle");

  // Tilbud fra prismotoren (simulerte)
  const simulerteTilbud = useMemo(()=>
    VARER.map(v=>{
      const best = bestePris(v.id, butikkIds);
      return best?.tilbud ? {vare:v, ...best} : null;
    }).filter(Boolean).sort((a,b)=>a.pris-b.pris)
  ,[butikkIds, pv]);

  // Brukerrapporterte tilbud
  const rapporterteTilbud = useMemo(()=>
    rapporter
      .filter(r=>r.erTilbud && r.status!=="avvist")
      .map(r=>{
        const vare = VARER.find(v=>v.id===r.vareId);
        const butikk = SEED_BUTIKKER.find(b=>b.id===r.butikkId);
        if(!vare||!butikk) return null;
        const utgaatt = r.tilbudFrist && new Date(r.tilbudFrist) < new Date();
        return {...r, vare, butikk, utgaatt};
      }).filter(Boolean)
      .sort((a,b)=>b.tid-a.tid)
  ,[rapporter]);

  const vises = filter==="rapporterte" ? rapporterteTilbud
    : filter==="simulerte" ? simulerteTilbud
    : [...rapporterteTilbud.filter(r=>!r.utgaatt), ...simulerteTilbud];

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Tilbud" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["alle","Alle"],["rapporterte","Rapporterte"],["simulerte","Andre"]].map(([id,navn])=>(
            <button key={id} style={sChip(filter===id)} onClick={()=>setFilter(id)}>{navn}</button>
          ))}
        </div>

        {/* Brukerrapporterte tilbud */}
        {(filter==="alle"||filter==="rapporterte") && rapporterteTilbud.length>0 && (
          <div style={{marginBottom:16}}>
            {filter==="alle" && <h3 style={{fontSize:13.5,fontWeight:800,margin:"0 0 8px",color:C.text}}>📣 Rapportert av brukere</h3>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {rapporterteTilbud.map(r=>{
                const ni = novaInfo(r.vare.nova);
                return (
                  <div key={r.id} onClick={()=>onAapne(r.vare)} style={{...sCard,padding:"12px 14px",display:"flex",gap:12,alignItems:"center",cursor:"pointer",borderLeft:`4px solid ${C.gull}`,opacity:r.utgaatt?0.5:1}}>
                    <ProduktBilde vare={r.vare} str={44}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.vare.navn}</div>
                      <div style={{fontSize:12,color:C.sub}}>{r.butikk.navn}</div>
                      <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                        {r.utgaatt
                          ? <span style={{background:C.errLys,color:C.err,borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 6px"}}>Utgått</span>
                          : <span style={{background:"#fffdf0",color:"#856404",borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 6px"}}>🏷️ TILBUD</span>}
                        {r.tilbudFrist && !r.utgaatt && <span style={{fontSize:10.5,color:C.sub}}>til {r.tilbudFrist}</span>}
                        {r.bilde && <span style={{fontSize:10.5,color:C.sub}}>📷 bevis</span>}
                        <span style={{background:ni.farge+"22",color:ni.farge,borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{ni.kort}</span>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:16,fontWeight:800,color:C.text}}>{r.pris.toFixed(2).replace(".",",")} kr</div>
                      <button onClick={(e)=>{e.stopPropagation();onLeggTil(r.vare.id);}} style={{...sKnapp,padding:"5px 10px",fontSize:12,marginTop:4}}>+ Kurv</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Simulerte tilbud */}
        {(filter==="alle"||filter==="simulerte") && simulerteTilbud.length>0 && (
          <div>
            {filter==="alle" && <h3 style={{fontSize:13.5,fontWeight:800,margin:"0 0 8px",color:C.text}}>💰 Andre gode priser</h3>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {simulerteTilbud.map(({vare,pris,butikkId})=>{
                const b = SEED_BUTIKKER.find(x=>x.id===butikkId);
                const ni = novaInfo(vare.nova);
                return (
                  <div key={vare.id} onClick={()=>onAapne(vare)} style={{...sCard,padding:"12px 14px",display:"flex",gap:12,alignItems:"center",cursor:"pointer",borderLeft:`4px solid ${C.ok}`}}>
                    <ProduktBilde vare={vare} str={44}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vare.navn}</div>
                      <div style={{fontSize:12,color:C.sub}}>{b?.navn}</div>
                      <div style={{display:"flex",gap:5,marginTop:3}}>
                        <span style={{background:C.okLys,color:C.ok,borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 6px"}}>TILBUD</span>
                        <span style={{background:ni.farge+"22",color:ni.farge,borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{ni.kort}</span>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:16,fontWeight:800,color:C.text}}>{pris.toFixed(2).replace(".",",")} kr</div>
                      <button onClick={(e)=>{e.stopPropagation();onLeggTil(vare.id);}} style={{...sKnapp,padding:"5px 10px",fontSize:12,marginTop:4}}>+ Kurv</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {vises.length===0 && (
          <div style={{...sCard,padding:28,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>🏷️</div>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:6}}>Ingen tilbud funnet</div>
            <div style={{fontSize:13,color:C.sub,lineHeight:1.5}}>Ser du et tilbud i butikken? Rapporter det og hjelp andre spare penger – du får XP!</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════ MINE BIDRAG (XP, nivå, tillit) ════ */
function BidragSide({spiller, rapporter, bekreftelser, onTilbake}){
  const nivaa = xpTilNivaa(spiller.xp);
  const fra = xpForNivaa(nivaa), til = xpForNivaa(nivaa+1);
  const pct = Math.min(100, Math.round((spiller.xp-fra)/(til-fra)*100));
  const ti = tillitInfo(spiller.tillit);
  const stat = [
    ["Prisrapporter", rapporter.length],
    ["Bekreftelser", bekreftelser.length],
    ["Bildebevis", rapporter.filter(r=>r.bilde).length],
    ["XP totalt", spiller.xp],
  ];
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Mine bidrag" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <div style={{...sCard,padding:20,marginBottom:14,textAlign:"center"}}>
          <div style={{width:74,height:74,borderRadius:37,background:C.blueLys,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",flexDirection:"column"}}>
            <div style={{fontSize:10,fontWeight:800,color:C.blue,letterSpacing:0.5}}>NIVÅ</div>
            <div style={{fontSize:26,fontWeight:800,color:C.blue,lineHeight:1}}>{nivaa}</div>
          </div>
          <div style={{fontSize:13,color:C.sub,marginBottom:10}}>{spiller.xp} XP · {til-spiller.xp} XP til nivå {nivaa+1}</div>
          <div style={{height:8,background:C.bg,borderRadius:4,overflow:"hidden",marginBottom:16}}>
            <div style={{height:"100%",width:`${pct}%`,background:C.blue,borderRadius:4,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>Tillit</span>
            <span style={{fontSize:13,fontWeight:800,color:ti.farge}}>{ti.tekst} ({spiller.tillit}/100)</span>
          </div>
          <div style={{height:8,background:C.bg,borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${spiller.tillit}%`,background:ti.farge,borderRadius:4,transition:"width .4s"}}/>
          </div>
          <p style={{fontSize:11.5,color:C.sub,margin:"8px 0 0",lineHeight:1.5}}>Tilliten øker når prisene dine stemmer med andre rapporter, og synker ved store avvik. Høy tillit gjør at rapportene dine verifiseres direkte.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {stat.map(([t,v])=>(
            <div key={t} style={{...sCard,padding:"14px 16px"}}>
              <div style={{fontSize:20,fontWeight:800,color:C.text}}>{v}</div>
              <div style={{fontSize:12,color:C.sub,fontWeight:600}}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{...sCard,padding:16,marginBottom:14}}>
          <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 8px",color:C.text}}>Slik tjener du XP</h3>
          <p style={{fontSize:13,color:C.sub,margin:0,lineHeight:1.7}}>Prisrapport +10 · Bildebevis +15 ekstra · Bekreftelse +5 · Godkjent produkt- eller butikkforslag +25. XP-kravet øker for hvert nivå, og nivåer låser opp belønninger.</p>
        </div>
        <div style={{...sCard,padding:16}}>
          <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 8px",color:C.text}}>Historikk</h3>
          {spiller.historikk.length===0 && <p style={{fontSize:13,color:C.sub,margin:0}}>Ingen bidrag ennå. Rapporter eller bekreft en pris for å komme i gang.</p>}
          {spiller.historikk.map(h=>(
            <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.tekst}</div>
                <div style={{fontSize:11.5,color:C.sub}}>{dagTekst(h.tid)}</div>
              </div>
              <span style={{fontSize:13,fontWeight:800,color:C.ok}}>+{h.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════ BETALING (simulert) ════ */
function BetalingModal({tittel, linjer, knapp, onBekreft, onLukk}){
  const [kort,setKort] = useState(""); const [utlop,setUtlop] = useState(""); const [cvc,setCvc] = useState("");
  const [feil,setFeil] = useState(null);
  const send = ()=>{
    const siffer = kort.replace(/\s/g,"");
    if(siffer.length<12 || !/^\d+$/.test(siffer)) return setFeil("Skriv inn et gyldig kortnummer.");
    if(!/^\d{2}\/\d{2}$/.test(utlop)) return setFeil("Utløpsdato skrives som MM/ÅÅ.");
    if(!/^\d{3}$/.test(cvc)) return setFeil("CVC er de 3 sifrene bak på kortet.");
    onBekreft("•••• "+siffer.slice(-4));
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(16,24,40,0.45)",zIndex:60,display:"flex",alignItems:"flex-end"}} onClick={onLukk}>
      <div style={{background:C.card,borderRadius:"18px 18px 0 0",padding:"20px 20px 28px",width:"100%",boxSizing:"border-box",animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
        <h3 style={{fontSize:17,fontWeight:800,margin:"0 0 10px",color:C.text}}>{tittel}</h3>
        <div style={{background:C.blueLys,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          {linjer.map((l,i)=><div key={i} style={{fontSize:12.5,color:C.text,lineHeight:1.6,fontWeight:i===0?700:500}}>{l}</div>)}
        </div>
        <FeilBoks tekst={feil}/>
        <Felt label="Kortnummer" verdi={kort} onEndre={setKort} plassholder="0000 0000 0000 0000"/>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}><Felt label="Utløp" verdi={utlop} onEndre={setUtlop} plassholder="MM/ÅÅ"/></div>
          <div style={{flex:1}}><Felt label="CVC" verdi={cvc} onEndre={setCvc} plassholder="123"/></div>
        </div>
        <button style={sKnapp} onClick={send}>{knapp}</button>
        <button style={{...sKnappSek,marginTop:8}} onClick={onLukk}>Avbryt</button>
        <p style={{fontSize:11.5,color:C.sub,textAlign:"center",margin:"12px 0 0"}}>Demoversjon – ingen ekte betaling gjennomføres eller lagres.</p>
      </div>
    </div>
  );
}

/* ════ PREMIUM ════ */
const PREMIUM_FUNKSJONER = [
  {ikon:"🥗", tittel:"Fullt næringsinnhold", beskrivelse:"Se fett, karbohydrater, fiber og sukker på alle produkter. Gjør det enklere å spise bevisst.", premium:true},
  {ikon:"🔔", tittel:"Prisvarsler", beskrivelse:"Få varsel når favorittprodukter dine går under en pris du setter selv.", premium:true},
  {ikon:"📊", tittel:"Prishistorikk", beskrivelse:"Se hvordan prisen på et produkt har utviklet seg over tid.", premium:true},
  {ikon:"🛒", tittel:"Ubegrensede lister", beskrivelse:"Opprett så mange handlelister du vil.", premium:false},
  {ikon:"💰", tittel:"Flerbutikk-optimalisering", beskrivelse:"Finn den billigste kombinasjonen av butikker for din handlekurv.", premium:false},
  {ikon:"🥦", tittel:"NOVA-merking og alternativer", beskrivelse:"Se prosesseringsgrad og finn sunnere og billigere alternativer.", premium:false},
];

function PremiumSide({premium, rabattKlar, spiller, onKjop, onSiOpp, onTilbake}){
  const aktiv = premium.status==="gratis" || premium.status==="betalt";
  const nivaa = xpTilNivaa(spiller?.xp||0);
  const xpTilNivaa10 = Math.max(0, xpForNivaa(10) - (spiller?.xp||0));

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Premium" onTilbake={onTilbake}/>
      <div style={{padding:16}}>

        {/* ── Hero ── */}
        {!aktiv && (
          <div style={{background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)",borderRadius:20,padding:24,marginBottom:16,textAlign:"center",color:"#fff"}}>
            <div style={{fontSize:36,marginBottom:8}}>👑</div>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 6px",color:"#fff"}}>Matpilot Premium</h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.75)",margin:"0 0 20px",lineHeight:1.55}}>
              Få fullt utbytte av appen. Spis sunnere, spar mer og hold deg oppdatert på prisene som betyr noe for deg.
            </p>
            <div style={{background:"rgba(255,255,255,0.08)",borderRadius:14,padding:"14px 20px",marginBottom:18}}>
              <div style={{fontSize:32,fontWeight:800,color:"#fff",lineHeight:1}}>
                {rabattKlar
                  ? <><span style={{textDecoration:"line-through",color:"rgba(255,255,255,0.4)",fontSize:20}}>29</span> 26</>
                  : "29"
                }
                <span style={{fontSize:16,fontWeight:600,color:"rgba(255,255,255,0.6)"}}> kr/mnd</span>
              </div>
              {rabattKlar && <div style={{fontSize:12,color:"#FFD700",fontWeight:700,marginTop:2}}>🎉 Du har en rabatt klar!</div>}
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:4}}>Fornyes automatisk · Si opp når som helst</div>
            </div>
            <button onClick={onKjop} style={{...sKnapp,background:"#FFD700",color:"#1a1a2e",fontWeight:800,fontSize:15}}>
              Start Premium nå
            </button>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:10}}>
              Ingen binding · Avbryt når du vil
            </div>
          </div>
        )}

        {/* ── Abonnementsstatus (aktiv) ── */}
        {aktiv && (
          <div style={{...sCard,padding:18,marginBottom:14,border:`2px solid ${C.gull}`,background:"#fffdf0"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{fontSize:28}}>👑</div>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:C.text}}>
                  {premium.status==="gratis" ? "Gratisperiode aktiv" : "Premium aktivt"}
                </div>
                <div style={{fontSize:12.5,color:C.sub}}>
                  {premium.status==="gratis"
                    ? Gratis til ${dagTekst(premium.sluttdato)}
                    : `Fornyes ${dagTekst(premium.fornyes)} · ${premium.pris} kr/mnd`}
                </div>
              </div>
              <div style={{marginLeft:"auto",background:C.ok,color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:800}}>AKTIV</div>
            </div>
            {premium.status==="gratis" && !premium.sagtOpp && (
              <div style={{background:C.blueLys,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12.5,color:C.text,lineHeight:1.6}}>
                Etter gratisperioden fortsetter abonnementet til <b>{premium.prisEtter} kr/mnd</b> på kortet <b>{premium.kort}</b>. Si opp før <b>{dagTekst(premium.sluttdato)}</b> for å unngå betaling.
              </div>
            )}
            {premium.sagtOpp && (
              <div style={{background:C.warnLys,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12.5,color:C.text,lineHeight:1.6}}>
                Du har sagt opp. Premium-tilgangen varer ut {premium.status==="gratis"?"gratisperioden":"betalt periode"}, og ingenting trekkes etter det.
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              {!premium.sagtOpp && (
                <button style={{...sKnappSek,width:"auto",flex:1,fontSize:13,color:C.err}} onClick={onSiOpp}>
                  Si opp abonnementet
                </button>
              )}
              <button style={{...sKnappSek,width:"auto",flex:1,fontSize:13}} onClick={()=>{}}>
                Gjenopprett kjøp
              </button>
            </div>
          </div>
        )}

        {/* ── Funksjoner ── */}
        <div style={{...sCard,padding:18,marginBottom:14}}>
          <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 12px",color:C.text}}>Hva du får</h3>
          {PREMIUM_FUNKSJONER.map((f,i)=>(
            <div key={f.tittel} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",borderBottom:i<PREMIUM_FUNKSJONER.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{width:36,height:36,borderRadius:10,background:f.premium?C.blueLys:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {f.ikon}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontSize:13.5,fontWeight:700,color:C.text}}>{f.tittel}</span>
                  {f.premium && <span style={{background:"#FFD700",color:"#5a4000",borderRadius:5,fontSize:10,fontWeight:800,padding:"1px 6px"}}>PREMIUM</span>}
                </div>
                <div style={{fontSize:12.5,color:C.sub,lineHeight:1.5}}>{f.beskrivelse}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Gratis Premium via nivå ── */}
        <div style={{...sCard,padding:16,marginBottom:14,borderLeft:`4px solid ${C.gull}`}}>
          <div style={{fontSize:13.5,fontWeight:800,color:C.text,marginBottom:4}}>🎁 Tjen deg til gratis Premium</div>
          <p style={{fontSize:12.5,color:C.sub,margin:"0 0 8px",lineHeight:1.5}}>
            Nå nivå 10 ved å rapportere priser og bekrefte andres bidrag – da låser du opp 1 måned gratis Premium.
          </p>
          {nivaa < 10 ? (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,color:C.sub,marginBottom:4}}>
                <span>Nivå {nivaa}</span>
                <span>{xpTilNivaa10} XP igjen til nivå 10</span>
              </div>
              <div style={{height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(100,(spiller?.xp||0)/xpForNivaa(10)*100)}%`,background:C.gull,borderRadius:3}}/>
              </div>
            </div>
          ) : (
            <div style={{fontSize:13,fontWeight:700,color:C.ok}}>✓ Du har nådd nivå 10 – sjekk Belønninger!</div>
          )}
        </div>

        {/* ── Kjøp-knapp (nederst for ikke-aktive) ── */}
        {!aktiv && (
          <button onClick={onKjop} style={{...sKnapp,marginBottom:8}}>
            Start Premium – {rabattKlar?"26":"29"} kr/mnd
          </button>
        )}
        <p style={{fontSize:12,color:C.sub,textAlign:"center",lineHeight:1.6,margin:0}}>
          Betalingen håndteres sikkert. Abonnementet kan sies opp når som helst under Profil → Premium. I en lansert app vil betaling gå via Apple Pay, Google Pay eller Vipps.
        </p>
      </div>
    </div>
  );
}

/* ════ BELØNNINGER ════ */
function BelonningerSide({spiller, belonningStatus, premium, onAktiverRabatt, onStartGratis, onTilbake}){
  const nivaa = xpTilNivaa(spiller.xp);
  const radFor = (b)=>{
    const st = belonningStatus[b.id];
    const laast = !st;
    let statusTekst, handling=null;
    if(laast){
      statusTekst = Låses opp på nivå ${b.level} (du er på nivå ${nivaa});
    } else if(b.type==="badge"){
      statusTekst = Mottatt ${dagTekst(st.laastOpp)} – vises på profilen din;
    } else if(b.type==="rabatt"){
      if(st.brukt) statusTekst = Brukt ${dagTekst(st.brukt)};
      else if(st.aktivert) statusTekst = "Aktivert – brukes automatisk på neste Premium-betaling";
      else { statusTekst = Låst opp ${dagTekst(st.laastOpp)}; handling = <button style={{...sKnapp,marginTop:10}} onClick={onAktiverRabatt}>Aktiver rabatten</button>; }
    } else if(b.type==="premium1m"){
      const frist = st.laastOpp + 30*DAG;
      if(st.aktivert) statusTekst = Aktivert ${dagTekst(st.aktivert)};
      else if(naa()>frist) statusTekst = Utløp ${dagTekst(frist)} – ble ikke aktivert innen 30 dager;
      else {
        statusTekst = Må aktiveres innen ${dagTekst(frist)};
        handling = (
          <div style={{marginTop:10}}>
            <div style={{background:C.blueLys,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
              <div style={{fontSize:12.5,color:C.text,lineHeight:1.6}}>
                <b>Varighet:</b> 30 dager gratis<br/>
                <b>Pris etter prøveperioden:</b> 29 kr/mnd, trekkes automatisk<br/>
                <b>Oppsigelse:</b> når som helst under Profil → Premium – sier du opp før gratisperioden er over, trekkes ingenting
              </div>
            </div>
            <button style={sKnapp} onClick={onStartGratis}>Aktiver gratis Premium</button>
          </div>
        );
      }
    }
    return (
      <div key={b.id} style={{...sCard,padding:16,marginBottom:10,opacity:laast?0.55:1}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <span style={{fontSize:26}}>{b.ikon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14.5,fontWeight:800,color:C.text}}>{b.tittel} <span style={{fontSize:11.5,fontWeight:700,color:C.sub}}>· Nivå {b.level}</span></div>
            <div style={{fontSize:12.5,color:C.sub,lineHeight:1.5,margin:"2px 0 4px"}}>{b.besk}</div>
            <div style={{fontSize:12,fontWeight:700,color:laast?C.sub:C.blue}}>{statusTekst}</div>
            {handling}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Belønninger" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <p style={{fontSize:13.5,color:C.sub,margin:"0 0 14px",lineHeight:1.5}}>Bidra med priser og bekreftelser for å nå nye nivåer og låse opp belønninger.</p>
        {BELONNINGER.map(radFor)}
      </div>
    </div>
  );
}

/* ════ VARSLER ════ */
function VarslerSide({varsler, onTilbake, onLes}){
  useEffect(()=>{ onLes(); },[]);
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Varsler" onTilbake={onTilbake}/>
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {varsler.length===0 ? (
          <div style={{...sCard,padding:32,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>🔔</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>Ingen varsler</div>
            <div style={{fontSize:13.5,color:C.sub,lineHeight:1.5}}>Her får du beskjed om belønninger, frister og betalinger.</div>
          </div>
        ) : varsler.map(v=>(
          <div key={v.id} style={{...sCard,padding:"14px 16px",borderLeft:v.lest?`1px solid ${C.border}`:`4px solid ${C.blue}`}}>
            <div style={{fontSize:13.5,fontWeight:800,color:C.text,marginBottom:2}}>{v.tittel}</div>
            <div style={{fontSize:12.5,color:C.sub,lineHeight:1.5,marginBottom:4}}>{v.tekst}</div>
            <div style={{fontSize:11,color:C.sub}}>{dagTekst(v.tid)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════ FORESLÅ PRODUKT ════ */
function ForeslaaProduktSide({butikkIds, onSend, onTilbake}){
  const [f,setF] = useState({navn:"",prod:"",kat:"meieri",butikkId:butikkIds[0]||SEED_BUTIKKER[0]?.id,pris:"",vekt:"",kcal:"",protein:"",kommentar:"",bilde:null});
  const s=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const kats = KAT.filter(k=>!["favoritter","tilbud"].includes(k.id));
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Foreslå nytt produkt" onTilbake={onTilbake}/>
      <div style={{padding:"20px 16px"}}>
        <p style={{fontSize:13,color:C.sub,margin:"0 0 16px",lineHeight:1.5}}>Forslaget publiseres ikke automatisk – det går til en godkjenningskø hos administrator. Godkjente forslag gir +25 XP.</p>
        <Felt label="Produktnavn *" verdi={f.navn} onEndre={s("navn")} plassholder="f.eks. Kesam Original 350g"/>
        <Felt label="Produsent" verdi={f.prod} onEndre={s("prod")} plassholder="f.eks. TINE"/>
        <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Kategori</div>
        <select value={f.kat} onChange={e=>s("kat")(e.target.value)} style={{...sInput,marginBottom:12,appearance:"auto"}}>
          {kats.map(k=><option key={k.id} value={k.id}>{k.navn}</option>)}
        </select>
        <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Butikk der du så produktet</div>
        <select value={f.butikkId} onChange={e=>s("butikkId")(e.target.value)} style={{...sInput,marginBottom:12,appearance:"auto"}}>
          {SEED_BUTIKKER.map(b=><option key={b.id} value={b.id}>{b.navn}</option>)}
        </select>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}><Felt label="Pris (kr)" verdi={f.pris} onEndre={s("pris")} plassholder="29,90"/></div>
          <div style={{flex:1}}><Felt label="Vekt/størrelse" verdi={f.vekt} onEndre={s("vekt")} plassholder="350g"/></div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}><Felt label="Kcal per 100 g" verdi={f.kcal} onEndre={s("kcal")} plassholder="valgfritt"/></div>
          <div style={{flex:1}}><Felt label="Protein per 100 g" verdi={f.protein} onEndre={s("protein")} plassholder="valgfritt"/></div>
        </div>
        <Felt label="Kommentar" verdi={f.kommentar} onEndre={s("kommentar")} plassholder="valgfritt"/>
        <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Produktbilde (valgfritt)</div>
        <label style={{...sKnappSek,display:"block",textAlign:"center",marginBottom:16,boxSizing:"border-box"}}>
          {f.bilde ? ✓ ${f.bilde} : "Legg ved bilde"}
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>s("bilde")(e.target.files?.[0]?.name||null)}/>
        </label>
        <button style={{...sKnapp,opacity:f.navn.trim()?1:0.4}} disabled={!f.navn.trim()} onClick={()=>onSend(f)}>Send til godkjenning</button>
      </div>
    </div>
  );
}

/* ════ FORESLÅ BUTIKK ════ */
function ForeslaaButikkSide({onSend, onTilbake}){
  const [f,setF] = useState({navn:"",kjede:"KIWI",adresse:"",postnr:"",sted:"",kommentar:"",bilde:null});
  const s=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const dup = finnDuplikatButikker(f.navn, f.adresse);
  const gyldig = f.navn.trim() && f.adresse.trim() && f.sted.trim();
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Foreslå ny butikk" onTilbake={onTilbake}/>
      <div style={{padding:"20px 16px"}}>
        <p style={{fontSize:13,color:C.sub,margin:"0 0 16px",lineHeight:1.5}}>Butikken publiseres etter godkjenning, og kan da brukes til prisrapportering, som foretrukket butikk og i handlekurv-sammenligningen. Godkjente forslag gir +25 XP.</p>
        <Felt label="Butikknavn *" verdi={f.navn} onEndre={s("navn")} plassholder="f.eks. Kiwi Heimdal"/>
        <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Kjede</div>
        <select value={f.kjede} onChange={e=>s("kjede")(e.target.value)} style={{...sInput,marginBottom:12,appearance:"auto"}}>
          {Object.entries(KJEDER).map(([k,i])=><option key={k} value={k}>{i.navn}</option>)}
        </select>
        <Felt label="Adresse *" verdi={f.adresse} onEndre={s("adresse")} plassholder="Gateadresse"/>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}><Felt label="Postnummer" verdi={f.postnr} onEndre={s("postnr")} plassholder="7030"/></div>
          <div style={{flex:2}}><Felt label="Sted *" verdi={f.sted} onEndre={s("sted")} plassholder="Trondheim"/></div>
        </div>
        <Felt label="Kommentar" verdi={f.kommentar} onEndre={s("kommentar")} plassholder="valgfritt"/>
        <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Bilde (valgfritt)</div>
        <label style={{...sKnappSek,display:"block",textAlign:"center",marginBottom:12,boxSizing:"border-box"}}>
          {f.bilde ? ✓ ${f.bilde} : "Legg ved bilde"}
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>s("bilde")(e.target.files?.[0]?.name||null)}/>
        </label>
        {dup.length>0 && (
          <div style={{background:C.warnLys,borderRadius:10,padding:"10px 14px",marginBottom:12}}>
            <div style={{fontSize:12.5,fontWeight:800,color:C.warn,marginBottom:2}}>Mulig duplikat</div>
            <div style={{fontSize:12.5,color:C.text,lineHeight:1.5}}>Ligner på: {dup.slice(0,3).map(b=>b.navn).join(", ")}. Sjekk at butikken ikke finnes fra før.</div>
          </div>
        )}
        <button style={{...sKnapp,opacity:gyldig?1:0.4}} disabled={!gyldig} onClick={()=>onSend(f)}>Send til godkjenning</button>
      </div>
    </div>
  );
}

/* ════ SUPPORT (bruker) ════ */
function StatusBadge({status}){
  const f = sakStatusFarge(status);
  return <span style={{background:f.b,color:f.f,borderRadius:7,padding:"2px 8px",fontSize:11,fontWeight:800,whiteSpace:"nowrap"}}>{status}</span>;
}
function SupportSide({saker, onNySak, onAapneSak, onTilbake}){
  const [aapenFaq,setAapenFaq] = useState(null);
  const [nySak,setNySak] = useState(false);
  const [kategori,setKategori] = useState(SAK_KATEGORIER[0]);
  const [tekst,setTekst] = useState("");
  const [vedlegg,setVedlegg] = useState(null);
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Support" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 8px",color:C.text}}>Ofte stilte spørsmål</h3>
        <div style={{...sCard,padding:"4px 16px",marginBottom:16}}>
          {FAQ.map((f,i)=>(
            <div key={i} style={{borderBottom:i<FAQ.length-1?`1px solid ${C.border}`:"none"}}>
              <button onClick={()=>setAapenFaq(aapenFaq===i?null:i)} style={{background:"none",border:"none",width:"100%",display:"flex",alignItems:"center",gap:8,padding:"12px 0",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:13.5,fontWeight:700,color:C.text,flex:1}}>{f.q}</span>
                <span style={{color:C.sub,fontSize:16,transform:aapenFaq===i?"rotate(90deg)":"none",transition:"transform .15s"}}>›</span>
              </button>
              {aapenFaq===i && <p style={{fontSize:13,color:C.sub,lineHeight:1.6,margin:"0 0 12px"}}>{f.a}</p>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
          <h3 style={{fontSize:14,fontWeight:800,margin:0,color:C.text,flex:1}}>Mine saker</h3>
          <button style={lnk} onClick={()=>setNySak(true)}>+ Kontakt support</button>
        </div>
        {saker.length===0 ? (
          <div style={{...sCard,padding:24,textAlign:"center"}}>
            <div style={{fontSize:13.5,color:C.sub,lineHeight:1.5}}>Fant du ikke svar i FAQ? Opprett en sak, så svarer vi deg her i appen.</div>
            <button style={{...sKnapp,marginTop:12}} onClick={()=>setNySak(true)}>Kontakt support</button>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {saker.map(s=>(
              <button key={s.id} onClick={()=>onAapneSak(s.id)} style={{...sCard,padding:"13px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:C.text}}>{s.kategori}</div>
                  <div style={{fontSize:12,color:C.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.meldinger[s.meldinger.length-1].tekst}</div>
                </div>
                <StatusBadge status={s.status}/>
              </button>
            ))}
          </div>
        )}
      </div>
      {nySak && (
        <div style={{position:"fixed",inset:0,background:"rgba(16,24,40,0.45)",zIndex:60,display:"flex",alignItems:"flex-end"}} onClick={()=>setNySak(false)}>
          <div style={{background:C.card,borderRadius:"18px 18px 0 0",padding:"20px 20px 28px",width:"100%",boxSizing:"border-box",animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontSize:17,fontWeight:800,margin:"0 0 12px",color:C.text}}>Kontakt support</h3>
            <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Kategori</div>
            <select value={kategori} onChange={e=>setKategori(e.target.value)} style={{...sInput,marginBottom:12,appearance:"auto"}}>
              {SAK_KATEGORIER.map(k=><option key={k}>{k}</option>)}
            </select>
            <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Melding</div>
            <textarea value={tekst} onChange={e=>setTekst(e.target.value)} rows={4} style={{...sInput,resize:"vertical",marginBottom:12,fontFamily:FONT}} placeholder="Beskriv hva det gjelder …"/>
            <label style={{...sKnappSek,display:"block",textAlign:"center",marginBottom:12,boxSizing:"border-box"}}>
              {vedlegg ? ✓ ${vedlegg} : "Legg ved skjermbilde (valgfritt)"}
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>setVedlegg(e.target.files?.[0]?.name||null)}/>
            </label>
            <button style={{...sKnapp,opacity:tekst.trim()?1:0.4}} disabled={!tekst.trim()} onClick={()=>{onNySak({kategori,tekst:tekst.trim(),vedlegg});setNySak(false);setTekst("");setVedlegg(null);}}>Opprett sak</button>
            <button style={{...sKnappSek,marginTop:8}} onClick={()=>setNySak(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  );
}
function SakTraadSide({sak, erAdmin, onSvar, onStatusEndre, onTilbake}){
  const [tekst,setTekst] = useState("");
  const laast = sak.status==="Lukket" && !erAdmin;
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:120,fontFamily:FONT}}>
      <UnderHeader tittel={sak.kategori} onTilbake={onTilbake} hoyre={<StatusBadge status={sak.status}/>}/>
      <div style={{padding:16}}>
        {erAdmin && (
          <div style={{...sCard,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12.5,fontWeight:700,color:C.sub}}>Status</span>
            <select value={sak.status} onChange={e=>onStatusEndre(e.target.value)} style={{...sInput,padding:"8px 10px",fontSize:13,flex:1,appearance:"auto"}}>
              {SAK_STATUSER.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {sak.meldinger.map((m,i)=>(
            <div key={i} style={{alignSelf:m.fra==="bruker"?"flex-end":"flex-start",maxWidth:"85%"}}>
              <div style={{background:m.fra==="bruker"?C.blue:C.card,color:m.fra==="bruker"?"#fff":C.text,border:m.fra==="bruker"?"none":`1px solid ${C.border}`,borderRadius:14,padding:"10px 14px",fontSize:13.5,lineHeight:1.5}}>
                {m.tekst}
                {m.vedlegg && <div style={{fontSize:11.5,opacity:0.8,marginTop:4}}>📎 {m.vedlegg}</div>}
              </div>
              <div style={{fontSize:10.5,color:C.sub,margin:"3px 6px 0",textAlign:m.fra==="bruker"?"right":"left"}}>{m.fra==="bruker"?"Du":"Support"} · {dagTekst(m.tid)}</div>
            </div>
          ))}
        </div>
        {laast && <p style={{fontSize:12.5,color:C.sub,textAlign:"center",marginTop:16}}>Saken er lukket. Opprett en ny sak hvis du trenger mer hjelp.</p>}
      </div>
      {!laast && (
        <div style={{position:"fixed",left:0,right:0,bottom:0,padding:"12px 16px 22px",background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <input style={{...sInput,flex:1}} placeholder="Skriv et svar …" value={tekst} onChange={e=>setTekst(e.target.value)}/>
          <button style={{...sKnapp,width:"auto",padding:"12px 18px",opacity:tekst.trim()?1:0.4}} disabled={!tekst.trim()} onClick={()=>{onSvar(tekst.trim());setTekst("");}}>Send</button>
        </div>
      )}
    </div>
  );
}

/* ════ ADMIN: DASHBORD ════ */
function AdminSide({tall, gaaTil, onTilbake}){
  // Datakvalitets-stats
  const utenBilde = VARER.filter(v=>!v.bilde).length;
  const utenNova = VARER.filter(v=>!v.nova).length;
  const utenNaering = VARER.filter(v=>!v.m || Object.keys(v.m).length===0).length;
  const utenPris = VARER.filter(v=>!SEED_BUTIKKER.some(b=>butikkPris(v.id,b.id))).length;
  const kvalitetsPct = Math.round(100 - ((utenBilde+utenNova+utenNaering+utenPris)/(VARER.length*4))*100);

  const stat = [
    ["Prisrapporter i kø", tall.rapporter, "adminRapporter"],
    ["Produktforslag", tall.produkter, "adminProduktForslag"],
    ["Butikkforslag", tall.butikker, "adminButikkForslag"],
    ["Åpne saker", tall.saker, "adminSupport"],
  ];
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Administrasjonspanel" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {stat.map(([t,v,side])=>(
            <button key={t} onClick={()=>gaaTil({navn:side})} style={{...sCard,padding:"14px 16px",cursor:"pointer",textAlign:"left",border:v>0?`2px solid ${C.blue}`:`1px solid ${C.border}`}}>
              <div style={{fontSize:22,fontWeight:800,color:v>0?C.blue:C.text}}>{v}</div>
              <div style={{fontSize:11.5,color:C.sub,fontWeight:700}}>{t}</div>
            </button>
          ))}
        </div>

        {/* Datakvalitetspanel */}
        <div style={{...sCard,padding:16,marginBottom:14,border:`2px solid ${kvalitetsPct>=80?C.ok:kvalitetsPct>=50?C.warn:C.err}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h3 style={{fontSize:14,fontWeight:800,margin:0,color:C.text}}>📊 Datakvalitet</h3>
            <div style={{fontSize:20,fontWeight:800,color:kvalitetsPct>=80?C.ok:kvalitetsPct>=50?C.warn:C.err}}>{kvalitetsPct}%</div>
          </div>
          <div style={{height:6,background:C.bg,borderRadius:3,marginBottom:12,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${kvalitetsPct}%`,background:kvalitetsPct>=80?C.ok:kvalitetsPct>=50?C.warn:C.err,borderRadius:3}}/>
          </div>
          {[
            ["Uten bilde", utenBilde, utenBilde===0],
            ["Uten NOVA-vurdering", utenNova, utenNova===0],
            ["Uten næringsdata", utenNaering, utenNaering===0],
            ["Uten prisdata", utenPris, utenPris===0],
          ].map(([t,v,ok])=>(
            <div key={t} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:12.5,color:C.text}}>{t}</span>
              <span style={{fontSize:12.5,fontWeight:800,color:ok?C.ok:C.err}}>{ok?"✓":v+" produkter"}</span>
            </div>
          ))}
          <button style={{...sKnappSek,marginTop:12,fontSize:13}} onClick={()=>gaaTil({navn:"adminDatakvalitet"})}>
            Se detaljert datakvalitet →
          </button>
        </div>

        <div style={{...sCard,padding:"4px 16px"}}>
          <MenyRad ikon="🛒" tittel="Produkter og priser" detalj="Søk, sett og slett" onClick={()=>gaaTil({navn:"adminProdukter"})}/>
          <MenyRad ikon="🏷️" tittel="Prisrapporter" detalj={tall.rapporter} onClick={()=>gaaTil({navn:"adminRapporter"})}/>
          <MenyRad ikon="📊" tittel="Datakvalitet" detalj={`${kvalitetsPct}%`} onClick={()=>gaaTil({navn:"adminDatakvalitet"})}/>
          <MenyRad ikon="📦" tittel="Produktforslag" detalj={tall.produkter} onClick={()=>gaaTil({navn:"adminProduktForslag"})}/>
          <MenyRad ikon="🏪" tittel="Butikkforslag" detalj={tall.butikker} onClick={()=>gaaTil({navn:"adminButikkForslag"})}/>
          <MenyRad ikon="💬" tittel="Supportinnboks" detalj={tall.saker} onClick={()=>gaaTil({navn:"adminSupport"})}/>
          <MenyRad ikon="💳" tittel="Refusjoner og abonnement" onClick={()=>gaaTil({navn:"adminRefusjon"})} siste/>
        </div>
        <p style={{fontSize:12,color:C.sub,margin:"14px 4px 0",lineHeight:1.5}}>Priser du legger inn som administrator behandles som verifiserte, slik at databasen kan bygges opp før lansering.</p>
      </div>
    </div>
  );
}

/* ════ ADMIN: DATAKVALITET ════ */
function AdminDatakvalitetSide({rapporter, onTilbake}){
  const [filter, setFilter] = useState("alle");

  // Finn prisavvik: priser som avviker >40% fra snitt i kjeden
  const avvik = useMemo(()=>{
    const res = [];
    for(const vare of VARER){
      const priserPerKjede = {};
      for(const b of SEED_BUTIKKER){
        const p = butikkPris(vare.id, b.id);
        if(!p) continue;
        if(!priserPerKjede[b.kjede]) priserPerKjede[b.kjede] = [];
        priserPerKjede[b.kjede].push({butikk:b, pris:p.pris, kilde:p.kilde});
      }
      for(const [kjede, entries] of Object.entries(priserPerKjede)){
        if(entries.length < 2) continue;
        const snitt = entries.reduce((s,e)=>s+e.pris,0)/entries.length;
        for(const e of entries){
          const avvik = Math.abs(e.pris-snitt)/snitt;
          if(avvik > 0.4) res.push({vare, butikk:e.butikk, pris:e.pris, snitt, avvikPct:Math.round(avvik*100)});
        }
      }
    }
    return res.sort((a,b)=>b.avvikPct-a.avvikPct).slice(0,30);
  },[]);

  const utenBilde = VARER.filter(v=>!v.bilde);
  const utenNova = VARER.filter(v=>!v.nova);
  const utenNaering = VARER.filter(v=>!v.m || Object.keys(v.m).length===0);
  const utenPris = VARER.filter(v=>!SEED_BUTIKKER.some(b=>butikkPris(v.id,b.id)));

  // Gamle rapporter (>7 dager)
  const gamleRapporter = rapporter.filter(r=>naa()-r.tid > 7*DAG && r.status==="venter");

  const filtre = [
    ["alle","Oversikt"],
    ["utenbilde","Uten bilde"],
    ["utennova","Uten NOVA"],
    ["utennaering","Uten næring"],
    ["utenpris","Uten pris"],
    ["avvik","Prisavvik"],
    ["gamle","Gamle rapporter"],
  ];

  const visteVarer = filter==="utenbilde" ? utenBilde
    : filter==="utennova" ? utenNova
    : filter==="utennaering" ? utenNaering
    : filter==="utenpris" ? utenPris
    : [];

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Datakvalitet" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        {/* Filter-tabs */}
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:14}}>
          {filtre.map(([id,navn])=>(
            <button key={id} style={{...sChip(filter===id),flexShrink:0}} onClick={()=>setFilter(id)}>{navn}</button>
          ))}
        </div>

        {filter==="alle" && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[
                ["🖼️","Uten bilde",utenBilde.length,"utenbilde"],
                ["🥦","Uten NOVA",utenNova.length,"utennova"],
                ["📊","Uten næring",utenNaering.length,"utennaering"],
                ["💰","Uten pris",utenPris.length,"utenpris"],
                ["⚠️","Prisavvik",avvik.length,"avvik"],
                ["🕐","Gamle rapporter",gamleRapporter.length,"gamle"],
              ].map(([ikon,t,v,id])=>(
                <button key={id} onClick={()=>setFilter(id)} style={{...sCard,padding:"12px 14px",cursor:"pointer",textAlign:"left",border:v>0?`2px solid ${v>10?C.err:C.warn}`:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:16}}>{ikon}</span>
                    <span style={{fontSize:11.5,color:C.sub,fontWeight:700}}>{t}</span>
                  </div>
                  <div style={{fontSize:22,fontWeight:800,color:v>0?(v>10?C.err:C.warn):C.ok}}>{v===0?"✓":v}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Produktlister */}
        {visteVarer.length>0 && (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {visteVarer.map(v=>{
              const ni = novaInfo(v.nova);
              return (
                <div key={v.id} style={{...sCard,padding:"12px 14px",display:"flex",gap:10,alignItems:"center",borderLeft:`3px solid ${ni.farge}`}}>
                  <ProduktBilde vare={v} str={36}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.navn}</div>
                    <div style={{fontSize:11.5,color:C.sub}}>{v.prod} · {KAT.find(k=>k.id===v.kat)?.navn}</div>
                    <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                      {!v.bilde && <span style={{background:C.errLys,color:C.err,borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 5px"}}>Uten bilde</span>}
                      {!v.nova && <span style={{background:C.warnLys,color:C.warn,borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 5px"}}>Uten NOVA</span>}
                      {(!v.m||!v.m.kcal) && <span style={{background:C.warnLys,color:C.warn,borderRadius:4,fontSize:10,fontWeight:700,padding:"1px 5px"}}>Uten næring</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {visteVarer.length===0 && filter!=="alle" && filter!=="avvik" && filter!=="gamle" && (
          <div style={{...sCard,padding:24,textAlign:"center",fontSize:13.5,color:C.ok}}>✓ Ingen produkter i denne kategorien!</div>
        )}

        {/* Prisavvik */}
        {filter==="avvik" && (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {avvik.length===0 && <div style={{...sCard,padding:24,textAlign:"center",fontSize:13.5,color:C.ok}}>✓ Ingen mistenkelige prisavvik funnet!</div>}
            {avvik.map((a,i)=>(
              <div key={i} style={{...sCard,padding:"12px 14px"}}>
                <div style={{fontSize:13.5,fontWeight:700,color:C.text}}>{a.vare.navn}</div>
                <div style={{fontSize:12,color:C.sub,marginBottom:6}}>{a.butikk.navn}</div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:16,fontWeight:800,color:C.err}}>{a.pris.toFixed(2).replace(".",",")} kr</span>
                  <span style={{fontSize:12,color:C.sub}}>vs snitt {a.snitt.toFixed(2).replace(".",",")} kr</span>
                  <span style={{background:C.errLys,color:C.err,borderRadius:6,fontSize:11,fontWeight:800,padding:"2px 7px",marginLeft:"auto"}}>+{a.avvikPct}% avvik</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gamle rapporter */}
        {filter==="gamle" && (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {gamleRapporter.length===0 && <div style={{...sCard,padding:24,textAlign:"center",fontSize:13.5,color:C.ok}}>✓ Ingen ventende rapporter eldre enn 7 dager!</div>}
            {gamleRapporter.map(r=>{
              const vare = VARER.find(v=>v.id===r.vareId);
              const butikk = SEED_BUTIKKER.find(b=>b.id===r.butikkId);
              return (
                <div key={r.id} style={{...sCard,padding:"12px 14px"}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:C.text}}>{vare?.navn||r.vareId}</div>
                  <div style={{fontSize:12,color:C.sub}}>{butikk?.navn} · {dagTekst(r.tid)}</div>
                  <div style={{fontSize:16,fontWeight:800,color:C.warn,marginTop:4}}>{r.pris.toFixed(2).replace(".",",")} kr</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════ ADMIN: PRODUKTER OG PRISER ════ */
function AdminProdukterSide({pv, rapporter, onSettPris, onSlettPris, onSlettProdukt, onSettBilde, onTilbake}){
  const [sok,setSok] = useState("");
  const [filter,setFilter] = useState("alle");
  const [aapen,setAapen] = useState(null);
  const [nyPrisButikk,setNyPrisButikk] = useState(SEED_BUTIKKER[0]?.id);
  const [nyPris,setNyPris] = useState("");
  const [bildeUrl,setBildeUrl] = useState("");
  const [bekreftSlett,setBekreftSlett] = useState(false);

  const liste = useMemo(()=>{
    let v = VARER;
    if(sok.trim()){ const q=sok.trim().toLowerCase(); v=v.filter(x=>x.navn.toLowerCase().includes(q)||x.prod.toLowerCase().includes(q)); }
    if(filter==="utenpris") v = v.filter(x=>!SEED_BUTIKKER.some(b=>butikkPris(x.id,b.id)));
    if(filter==="gamle"){
      const gamleIds = new Set(rapporter.filter(r=>naa()-r.tid>14*DAG).map(r=>r.vareId));
      v = v.filter(x=>gamleIds.has(x.id));
    }
    return v.slice(0,60);
  },[sok,filter,pv,rapporter]);

  const velg = (id)=>{ setAapen(aapen===id?null:id); setNyPris(""); setBildeUrl(""); setBekreftSlett(false); };

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Produkter og priser" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <input style={{...sInput,marginBottom:10}} placeholder="Søk produkt …" value={sok} onChange={e=>setSok(e.target.value)}/>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[["alle","Alle"],["utenpris","Uten prisdata"],["gamle","Gamle priser (14+ dager)"]].map(([id,n])=>(
            <button key={id} style={sChip(filter===id)} onClick={()=>setFilter(id)}>{n}</button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {liste.length===0 && <div style={{...sCard,padding:20,textAlign:"center",fontSize:13,color:C.sub}}>Ingen produkter i dette filteret.</div>}
          {liste.map(v=>{
            const erAapen = aapen===v.id;
            const priser = erAapen ? SEED_BUTIKKER.map(b=>({b,p:butikkPris(v.id,b.id)})).filter(x=>x.p) : [];
            return (
              <div key={v.id} style={{...sCard,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>velg(v.id)}>
                  <ProduktBilde vare={v} str={38}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.navn}</div>
                    <div style={{fontSize:11.5,color:C.sub}}>{v.prod}{v.id.startsWith("bruker_")?" · brukerinnsendt":""}</div>
                  </div>
                  <span style={{color:C.sub,fontSize:16,transform:erAapen?"rotate(90deg)":"none"}}>›</span>
                </div>
                {erAapen && (
                  <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                    <div style={{fontSize:12,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginBottom:6}}>Priser ({priser.length} butikker)</div>
                    {priser.map(({b,p})=>(
                      <div key={b.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                        <Prikk kilde={p.kilde} tid={p.tid||0}/>
                        <span style={{fontSize:12.5,color:C.text,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.navn}</span>
                        <span style={{fontSize:12.5,fontWeight:800,color:C.text}}>{p.pris.toFixed(2).replace(".",",")} kr</span>
                        <button style={{...lnk,fontSize:12,color:C.err}} onClick={()=>onSlettPris(v.id,b.id)}>Slett</button>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:6,marginTop:10}}>
                      <select value={nyPrisButikk} onChange={e=>setNyPrisButikk(e.target.value)} style={{...sInput,flex:2,padding:"9px 10px",fontSize:12.5,appearance:"auto"}}>
                        {SEED_BUTIKKER.map(b=><option key={b.id} value={b.id}>{b.navn}</option>)}
                      </select>
                      <input style={{...sInput,flex:1,padding:"9px 10px",fontSize:12.5}} placeholder="kr" inputMode="decimal" value={nyPris} onChange={e=>setNyPris(e.target.value)}/>
                    </div>
                    <button style={{...sKnapp,marginTop:8,padding:"10px 12px",fontSize:13}} onClick={()=>{
                      const t=parseFloat(String(nyPris).replace(",","."));
                      if(!isNaN(t)&&t>0){ onSettPris(v.id,nyPrisButikk,Math.round(t*100)/100); setNyPris(""); }
                    }}>Sett pris (verifisert)</button>
                    <div style={{display:"flex",gap:6,marginTop:12}}>
                      <input style={{...sInput,flex:1,padding:"9px 10px",fontSize:12.5}} placeholder="Bilde-URL" value={bildeUrl} onChange={e=>setBildeUrl(e.target.value)}/>
                      <button style={{...sKnappSek,width:"auto",padding:"9px 12px",fontSize:12.5,opacity:bildeUrl.trim()?1:0.4}} disabled={!bildeUrl.trim()} onClick={()=>{onSettBilde(v.id,bildeUrl.trim());setBildeUrl("");}}>Lagre bilde</button>
                    </div>
                    <button style={{...sKnappSek,marginTop:12,color:C.err,fontSize:13}} onClick={()=>{ if(bekreftSlett){ onSlettProdukt(v.id); setAapen(null); } else setBekreftSlett(true); }}>
                      {bekreftSlett?"Er du sikker? Trykk igjen for å slette":"Slett produkt fra katalogen"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════ ADMIN: PRISRAPPORT-KØ ════ */
function AdminRapporterSide({rapporter, onGodkjenn, onAvvis, onTilbake}){
  const [visAlle, setVisAlle] = useState(false);
  const [storBilde, setStorBilde] = useState(null);
  const ventende = rapporter.filter(r=>r.status==="venter");
  const behandlet = rapporter.filter(r=>r.status!=="venter");

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel={`Prisrapporter (${ventende.length} venter)`} onTilbake={onTilbake}/>

      {/* Fullskjerm-bilde modal */}
      {storBilde && (
        <div onClick={()=>setStorBilde(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:99,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <img src={storBilde} style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:12,objectFit:"contain"}} alt="Bildebevis"/>
          <button onClick={()=>setStorBilde(null)} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:20,width:36,height:36,fontSize:18,cursor:"pointer"}}>✕</button>
        </div>
      )}

      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {ventende.length===0 && <div style={{...sCard,padding:24,textAlign:"center",fontSize:13.5,color:C.ok}}>Ingen prisrapporter venter på godkjenning. 🎉</div>}
        {ventende.map(r=>{
          const vare = VARER.find(v=>v.id===r.vareId);
          const butikk = SEED_BUTIKKER.find(b=>b.id===r.butikkId);
          const eksisterende = butikk ? butikkPris(r.vareId, butikk.id) : null;
          const avvik = eksisterende ? Math.round(Math.abs(r.pris-eksisterende.pris)/eksisterende.pris*100) : null;
          return (
            <div key={r.id} style={{...sCard,padding:16,borderLeft:`4px solid ${avvik>30?C.err:avvik>15?C.warn:C.ok}`}}>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
                <ProduktBilde vare={vare} str={44}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:C.text}}>{vare?.navn||r.vareId}</div>
                  <div style={{fontSize:12,color:C.sub}}>{butikk?.navn||r.butikkId}</div>
                  <div style={{fontSize:11.5,color:C.sub}}>{dagTekst(r.tid)} · Innsender #{r.brukerId?.slice(-4)||"?"}</div>
                </div>
              </div>

              {/* Pris og sammenligning */}
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:10,padding:"10px 12px",background:C.bg,borderRadius:10}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:C.sub,fontWeight:700,marginBottom:2}}>RAPPORTERT</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.text}}>{r.pris.toFixed(2).replace(".",",")} kr</div>
                </div>
                {eksisterende && (
                  <>
                    <div style={{color:C.border,fontSize:18}}>→</div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:11,color:C.sub,fontWeight:700,marginBottom:2}}>EKSISTERENDE</div>
                      <div style={{fontSize:20,fontWeight:800,color:C.sub}}>{eksisterende.pris.toFixed(2).replace(".",",")} kr</div>
                    </div>
                    {avvik!=null && <span style={{marginLeft:"auto",background:avvik>30?C.errLys:avvik>15?C.warnLys:C.okLys,color:avvik>30?C.err:avvik>15?C.warn:C.ok,borderRadius:8,padding:"4px 8px",fontSize:11.5,fontWeight:800}}>{avvik}% avvik</span>}
                  </>
                )}
              </div>

              {/* Bildebevis */}
              {r.bilde && (
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11.5,fontWeight:700,color:C.sub,marginBottom:6}}>📷 BILDEBEVIS – trykk for full størrelse</div>
                  <img
                    src={r.bilde} alt="Bildebevis"
                    onClick={()=>setStorBilde(r.bilde)}
                    style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10,cursor:"pointer",border:`1px solid ${C.border}`}}
                    onError={e=>{ e.target.style.display="none"; }}
                  />
                </div>
              )}

              {r.kommentar && (
                <div style={{background:C.bg,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12.5,color:C.text,fontStyle:"italic"}}>
                  «{r.kommentar}»
                </div>
              )}

              <div style={{display:"flex",gap:8}}>
                <button style={{...sKnapp,width:"auto",flex:1,padding:"10px 12px",fontSize:13,background:C.ok}} onClick={()=>onGodkjenn(r.id)}>✓ Godkjenn</button>
                <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13,color:C.err}} onClick={()=>onAvvis(r.id)}>✕ Avvis</button>
              </div>
            </div>
          );
        })}

        {behandlet.length>0 && (
          <>
            <button style={{...sKnappSek,fontSize:13}} onClick={()=>setVisAlle(v=>!v)}>
              {visAlle?"Skjul":"Vis"} behandlede ({behandlet.length})
            </button>
            {visAlle && behandlet.map(r=>{
              const vare = VARER.find(v=>v.id===r.vareId);
              const butikk = SEED_BUTIKKER.find(b=>b.id===r.butikkId);
              return (
                <div key={r.id} style={{...sCard,padding:"10px 14px",opacity:0.65,display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{vare?.navn}</div>
                    <div style={{fontSize:11.5,color:C.sub}}>{butikk?.navn} · {r.pris.toFixed(2).replace(".",",")} kr · {dagTekst(r.tid)}</div>
                  </div>
                  <span style={{background:r.status==="verifisert"?C.okLys:C.errLys,color:r.status==="verifisert"?C.ok:C.err,borderRadius:6,fontSize:11,fontWeight:800,padding:"2px 8px"}}>
                    {r.status==="verifisert"?"Godkjent":"Avvist"}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ════ ADMIN: PRODUKTFORSLAG-KØ ════ */
function AdminProduktForslagSide({forslag, onGodkjenn, onAvvis, onTilbake}){
  const [aapen,setAapen] = useState(null);
  const [red,setRed] = useState({});
  const ventende = forslag.filter(f=>f.status==="venter");
  const behandlet = forslag.filter(f=>f.status!=="venter");
  const kats = KAT.filter(k=>!["favoritter","tilbud"].includes(k.id));
  const aapne = (f)=>{ setAapen(f.id); setRed({navn:f.navn,prod:f.prod,kat:f.kat,nova:"",pris:f.pris,kcal:f.kcal,protein:f.protein}); };
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Produktforslag" onTilbake={onTilbake}/>
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {ventende.length===0 && <div style={{...sCard,padding:24,textAlign:"center",fontSize:13.5,color:C.sub}}>Ingen produktforslag venter. 🎉</div>}
        {ventende.map(f=>(
          <div key={f.id} style={{...sCard,padding:16}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text}}>{f.navn}</div>
            <div style={{fontSize:12.5,color:C.sub,lineHeight:1.6,margin:"4px 0 8px"}}>
              {f.prod&&`Produsent: ${f.prod} · `}{KAT.find(k=>k.id===f.kat)?.navn}<br/>
              Sett i: {SEED_BUTIKKER.find(b=>b.id===f.butikkId)?.navn||"ukjent"}{f.pris&&` · ${f.pris} kr`}{f.vekt&&` · ${f.vekt}`}<br/>
              {(f.kcal||f.protein)&&`Næring/100g: ${f.kcal?f.kcal+" kcal":""} ${f.protein?f.protein+" g protein":""}`}
              {f.bilde&&<><br/>📷 {f.bilde}</>}
              {f.kommentar&&<><br/>«{f.kommentar}»</>}
            </div>
            {aapen===f.id ? (
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                <Felt label="Produktnavn" verdi={red.navn} onEndre={v=>setRed(p=>({...p,navn:v}))}/>
                <Felt label="Produsent" verdi={red.prod} onEndre={v=>setRed(p=>({...p,prod:v}))}/>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <select value={red.kat} onChange={e=>setRed(p=>({...p,kat:e.target.value}))} style={{...sInput,flex:1,appearance:"auto"}}>
                    {kats.map(k=><option key={k.id} value={k.id}>{k.navn}</option>)}
                  </select>
                  <select value={red.nova} onChange={e=>setRed(p=>({...p,nova:e.target.value}))} style={{...sInput,flex:1,appearance:"auto"}}>
                    <option value="">NOVA: ikke satt</option>
                    {[1,2,3,4].map(n=><option key={n} value={n}>NOVA {n}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1}}><Felt label="Pris (kr)" verdi={red.pris} onEndre={v=>setRed(p=>({...p,pris:v}))}/></div>
                  <div style={{flex:1}}><Felt label="Kcal/100g" verdi={red.kcal} onEndre={v=>setRed(p=>({...p,kcal:v}))}/></div>
                  <div style={{flex:1}}><Felt label="Protein" verdi={red.protein} onEndre={v=>setRed(p=>({...p,protein:v}))}/></div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{...sKnapp,width:"auto",flex:1,padding:"10px 12px",fontSize:13,background:C.ok,opacity:red.navn?.trim()?1:0.4}} disabled={!red.navn?.trim()} onClick={()=>{onGodkjenn(f.id,red);setAapen(null);}}>Godkjenn og publiser</button>
                  <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13,color:C.err}} onClick={()=>{onAvvis(f.id);setAapen(null);}}>Avvis (−5 tillit)</button>
                </div>
              </div>
            ) : (
              <button style={{...sKnappSek,padding:"10px 12px",fontSize:13}} onClick={()=>aapne(f)}>Behandle forslaget</button>
            )}
          </div>
        ))}
        {behandlet.length>0 && (
          <>
            <div style={{fontSize:12.5,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginTop:6}}>Behandlet</div>
            {behandlet.map(f=>(
              <div key={f.id} style={{...sCard,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,opacity:0.75}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text,flex:1}}>{f.navn}</span>
                <span style={{fontSize:11.5,fontWeight:800,color:f.status==="godkjent"?C.ok:C.err}}>{f.status==="godkjent"?"Godkjent":"Avvist"}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ════ ADMIN: BUTIKKFORSLAG-KØ ════ */
function AdminButikkForslagSide({forslag, onGodkjenn, onAvvis, onSlaaSammen, onTilbake}){
  const [aapen,setAapen] = useState(null);
  const [red,setRed] = useState({});
  const ventende = forslag.filter(f=>f.status==="venter");
  const behandlet = forslag.filter(f=>f.status!=="venter");
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Butikkforslag" onTilbake={onTilbake}/>
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {ventende.length===0 && <div style={{...sCard,padding:24,textAlign:"center",fontSize:13.5,color:C.sub}}>Ingen butikkforslag venter. 🎉</div>}
        {ventende.map(f=>{
          const dup = finnDuplikatButikker(f.navn, f.adresse);
          return (
            <div key={f.id} style={{...sCard,padding:16}}>
              <div style={{fontSize:14,fontWeight:800,color:C.text}}>{f.navn}</div>
              <div style={{fontSize:12.5,color:C.sub,lineHeight:1.6,margin:"4px 0 8px"}}>
                {KJEDER[f.kjede]?.navn} · {f.adresse}{f.postnr&&`, ${f.postnr}`} {f.sted}
                {f.bilde&&<><br/>📷 {f.bilde}</>}
                {f.kommentar&&<><br/>«{f.kommentar}»</>}
              </div>
              {dup.length>0 && (
                <div style={{background:C.warnLys,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:800,color:C.warn,marginBottom:4}}>Mulige duplikater oppdaget</div>
                  {dup.slice(0,3).map(b=>(
                    <div key={b.id} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0"}}>
                      <span style={{fontSize:12.5,color:C.text,flex:1}}>{b.navn}</span>
                      <button style={{...lnk,fontSize:12}} onClick={()=>onSlaaSammen(f.id,b.navn)}>Slå sammen</button>
                    </div>
                  ))}
                </div>
              )}
              {aapen===f.id ? (
                <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                  <Felt label="Butikknavn" verdi={red.navn} onEndre={v=>setRed(p=>({...p,navn:v}))}/>
                  <div style={{fontSize:12.5,fontWeight:700,color:C.sub,marginBottom:5}}>Kjede</div>
                  <select value={red.kjede} onChange={e=>setRed(p=>({...p,kjede:e.target.value}))} style={{...sInput,marginBottom:12,appearance:"auto"}}>
                    {Object.entries(KJEDER).map(([k,i])=><option key={k} value={k}>{i.navn}</option>)}
                  </select>
                  <Felt label="Adresse" verdi={red.adresse} onEndre={v=>setRed(p=>({...p,adresse:v}))}/>
                  <Felt label="Sted" verdi={red.sted} onEndre={v=>setRed(p=>({...p,sted:v}))}/>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...sKnapp,width:"auto",flex:1,padding:"10px 12px",fontSize:13,background:C.ok,opacity:red.navn?.trim()?1:0.4}} disabled={!red.navn?.trim()} onClick={()=>{onGodkjenn(f.id,red);setAapen(null);}}>Godkjenn og publiser</button>
                    <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13,color:C.err}} onClick={()=>{onAvvis(f.id);setAapen(null);}}>Avvis (−5 tillit)</button>
                  </div>
                </div>
              ) : (
                <button style={{...sKnappSek,padding:"10px 12px",fontSize:13}} onClick={()=>{setAapen(f.id);setRed({navn:f.navn,kjede:f.kjede,adresse:f.adresse,sted:f.sted});}}>Behandle forslaget</button>
              )}
            </div>
          );
        })}
        {behandlet.length>0 && (
          <>
            <div style={{fontSize:12.5,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginTop:6}}>Behandlet</div>
            {behandlet.map(f=>(
              <div key={f.id} style={{...sCard,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,opacity:0.75}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text,flex:1}}>{f.navn}</span>
                <span style={{fontSize:11.5,fontWeight:800,color:f.status==="godkjent"?C.ok:f.status==="sammenslått"?C.warn:C.err}}>
                  {f.status==="godkjent"?"Godkjent":f.status==="sammenslått"?`Slått sammen med ${f.med}`:"Avvist"}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ════ ADMIN: SUPPORTINNBOKS ════ */
function AdminSupportSide({saker, onAapne, onTilbake}){
  const [sok,setSok] = useState("");
  const [filter,setFilter] = useState("alle");
  let liste = saker;
  if(filter!=="alle") liste = liste.filter(s=>s.status===filter);
  if(sok.trim()){ const q=sok.trim().toLowerCase(); liste = liste.filter(s=>s.kategori.toLowerCase().includes(q)||s.meldinger.some(m=>m.tekst.toLowerCase().includes(q))); }
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Supportinnboks" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <input style={{...sInput,marginBottom:10}} placeholder="Søk i saker …" value={sok} onChange={e=>setSok(e.target.value)}/>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10,scrollbarWidth:"none"}}>
          <button style={sChip(filter==="alle")} onClick={()=>setFilter("alle")}>Alle</button>
          {SAK_STATUSER.map(s=><button key={s} style={sChip(filter===s)} onClick={()=>setFilter(s)}>{s}</button>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {liste.length===0 && <div style={{...sCard,padding:24,textAlign:"center",fontSize:13.5,color:C.sub}}>Ingen saker her.</div>}
          {liste.map(s=>(
            <button key={s.id} onClick={()=>onAapne(s.id)} style={{...sCard,padding:"13px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:700,color:C.text}}>{s.kategori}</div>
                <div style={{fontSize:12,color:C.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.meldinger[s.meldinger.length-1].tekst}</div>
              </div>
              <StatusBadge status={s.status}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════ ADMIN: REFUSJONER ════ */
function AdminRefusjonSide({brukere, premium, betalinger, refusjoner, onUtfor, onTilbake}){
  const [sok,setSok] = useState("");
  const [valgt,setValgt] = useState(null);
  const [belop,setBelop] = useState("");
  const [grunn,setGrunn] = useState("");
  const treff = sok.trim() ? brukere.filter(b=>b.navn.toLowerCase().includes(sok.toLowerCase())||b.epost.toLowerCase().includes(sok.toLowerCase())) : brukere;
  const premiumTekst = premium.status==="betalt" ? Betalt · ${premium.pris} kr/mnd · fornyes ${dagTekst(premium.fornyes)}
    : premium.status==="gratis" ? Gratisperiode til ${dagTekst(premium.sluttdato)} : "Ikke aktivt abonnement";
  const utfor = (type)=>{
    const b = type==="refusjon" ? parseFloat(String(belop).replace(",",".")) : 0;
    if(type==="refusjon" && (isNaN(b)||b<=0)) return;
    if(!grunn.trim() && type!=="rabattkode") return;
    onUtfor({brukerEpost:valgt.epost, belop:b, begrunnelse:grunn.trim(), type});
    setBelop(""); setGrunn("");
  };
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40,fontFamily:FONT}}>
      <UnderHeader tittel="Refusjoner og abonnement" onTilbake={onTilbake}/>
      <div style={{padding:16}}>
        <input style={{...sInput,marginBottom:10}} placeholder="Søk bruker (navn eller e-post) …" value={sok} onChange={e=>{setSok(e.target.value);setValgt(null);}}/>
        {brukere.length===0 && <div style={{...sCard,padding:20,textAlign:"center",fontSize:13,color:C.sub,marginBottom:12}}>Ingen brukerkontoer er opprettet ennå.</div>}
        {!valgt && treff.map(b=>(
          <button key={b.id} onClick={()=>setValgt(b)} style={{...sCard,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",width:"100%",boxSizing:"border-box",marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13.5,fontWeight:700,color:C.text}}>{b.navn}</div>
              <div style={{fontSize:12,color:C.sub}}>{b.epost}</div>
            </div>
            <span style={{color:C.sub}}>›</span>
          </button>
        ))}
        {valgt && (
          <div style={{...sCard,padding:16,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14.5,fontWeight:800,color:C.text}}>{valgt.navn}</div>
                <div style={{fontSize:12.5,color:C.sub}}>{valgt.epost}</div>
              </div>
              <button style={lnk} onClick={()=>setValgt(null)}>Bytt</button>
            </div>
            <div style={{background:C.bg,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
              <div style={{fontSize:11.5,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4}}>Abonnement</div>
              <div style={{fontSize:13,color:C.text,fontWeight:600}}>{premiumTekst}</div>
            </div>
            <div style={{fontSize:11.5,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginBottom:4}}>Betalingshistorikk</div>
            {betalinger.length===0 ? <div style={{fontSize:12.5,color:C.sub,marginBottom:10}}>Ingen betalinger registrert.</div> :
              betalinger.map(b=>(
                <div key={b.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:12.5,color:C.text}}>{b.tekst} · {dagTekst(b.tid)}</span>
                  <span style={{fontSize:12.5,fontWeight:800,color:C.text}}>{b.belop} kr</span>
                </div>
              ))}
            <div style={{marginTop:12}}>
              <Felt label="Begrunnelse (loggføres)" verdi={grunn} onEndre={setGrunn} plassholder="f.eks. dobbelt trekk"/>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input style={{...sInput,flex:1,padding:"10px 12px"}} placeholder="Beløp (kr)" inputMode="decimal" value={belop} onChange={e=>setBelop(e.target.value)}/>
                <button style={{...sKnapp,width:"auto",padding:"10px 14px",fontSize:13}} onClick={()=>utfor("refusjon")}>Refunder</button>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13}} onClick={()=>utfor("gratis_tid")}>Gi 30 dager gratis</button>
                <button style={{...sKnappSek,width:"auto",flex:1,padding:"10px 12px",fontSize:13}} onClick={()=>utfor("rabattkode")}>Generer rabattkode</button>
              </div>
              <p style={{fontSize:11.5,color:C.sub,margin:"8px 0 0",lineHeight:1.5}}>Refusjon og rabattkode krever beløp/begrunnelse der det er relevant. Brukeren varsles i appen, og alt loggføres under.</p>
            </div>
          </div>
        )}
        <h3 style={{fontSize:14,fontWeight:800,margin:"6px 0 8px",color:C.text}}>Refusjonslogg</h3>
        {refusjoner.length===0 ? <div style={{...sCard,padding:20,textAlign:"center",fontSize:13,color:C.sub}}>Ingen loggførte handlinger ennå.</div> : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {refusjoner.map(r=>(
              <div key={r.id} style={{...sCard,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:13,fontWeight:800,color:C.text}}>{r.type==="refusjon"?`Refusjon: ${r.belop} kr`:r.type==="gratis_tid"?"30 dager gratis Premium":`Rabattkode: ${r.kode}`}</span>
                  <span style={{fontSize:11.5,color:C.sub}}>{dagTekst(r.dato)}</span>
                </div>
                <div style={{fontSize:12,color:C.sub,lineHeight:1.5}}>{r.brukerEpost} · {r.begrunnelse||"–"} · Utført av: {r.admin}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════ PROFIL ════ */
function MenyRad({ikon, tittel, detalj, onClick, siste}){
  return (
    <button onClick={onClick} style={{background:"none",border:"none",width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 2px",cursor:"pointer",borderBottom:siste?"none":`1px solid ${C.border}`}}>
      <span style={{fontSize:19,width:26,textAlign:"center"}}>{ikon}</span>
      <span style={{fontSize:14.5,fontWeight:700,color:C.text,flex:1,textAlign:"left"}}>{tittel}</span>
      {detalj!=null && <span style={{fontSize:13,color:C.sub,fontWeight:600}}>{detalj}</span>}
      <span style={{color:C.sub,fontSize:18}}>›</span>
    </button>
  );
}
/* ════ BADGES ════ */
const BADGES = [
  {id:"prisjeger",   ikon:"🎯", tittel:"Prisjeger",     beskrivelse:"Rapportert 10+ priser",   krav:(s,r)=>r.length>=10},
  {id:"ekspert",     ikon:"🏆", tittel:"Ekspert",        beskrivelse:"Nådd nivå 10",            krav:(s)=>xpTilNivaa(s.xp)>=10},
  {id:"analytiker",  ikon:"🔬", tittel:"Matanalytiker",  beskrivelse:"Bekreftet 20+ priser",   krav:(s,r,b)=>b.length>=20},
  {id:"pioneer",     ikon:"🚀", tittel:"Pioneer",        beskrivelse:"En av de første brukerne",krav:()=>true},
  {id:"handler",     ikon:"🛒", tittel:"Handleeksperten",beskrivelse:"Lagt til 50+ kurv-varer", krav:(s)=>s.xp>=100},
  {id:"bidragsyter", ikon:"🌟", tittel:"Bidragsyter",    beskrivelse:"Bidratt til fellesskapet",krav:(s)=>s.tillit>=60},
];

function ProfilSide({bruker, butikkIds, favoritter, lister, spiller, belonningStatus, premium, varsler, saker, erAdmin, adminTall, onToggleAdmin, gaaTil, onLoggUt, onNullstill, rapporter, bekreftelser}){
  const nivaa = xpTilNivaa(spiller.xp);
  const xpFra = xpForNivaa(nivaa), xpTil = xpForNivaa(nivaa+1);
  const xpPct = Math.min(100, Math.round((spiller.xp-xpFra)/(xpTil-xpFra)*100));
  const uleste = varsler.filter(v=>!v.lest).length;
  const premiumAktiv = premium.status==="gratis" || premium.status==="betalt";
  const klareBelonninger = BELONNINGER.filter(b=>{
    const st = belonningStatus[b.id];
    if(!st) return false;
    if(b.type==="rabatt") return !st.aktivert && !st.brukt;
    if(b.type==="premium1m") return !st.aktivert && naa()<=st.laastOpp+30*DAG;
    return false;
  }).length;

  // Badges
  const opptjenteBadges = BADGES.filter(b=>b.krav(spiller, rapporter||[], bekreftelser||[]));

  // Innsikter: estimert spart basert på XP (grov approksimering uten kjøpshistorikk)
  const estimertSpart = Math.round(spiller.xp * 0.8); // XP ≈ kroner spart (grov)
  const antallBidrag = (rapporter||[]).length + (bekreftelser||[]).length;

  return (
    <div style={{padding:"16px 16px 0",paddingBottom:30}}>
      <h1 style={{fontSize:24,fontWeight:800,margin:"0 0 14px",color:C.text,letterSpacing:-0.4}}>Profil</h1>

      {/* ── Profilkort med XP ── */}
      <div style={{...sCard,padding:18,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
          <div style={{width:60,height:60,borderRadius:30,background:C.blueLys,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:C.blue,flexShrink:0}}>
            {bruker ? bruker.navn.trim()[0].toUpperCase() : "👤"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            {bruker ? (
              <>
                <div style={{fontSize:16,fontWeight:800,color:C.text}}>{bruker.navn}</div>
                <div style={{fontSize:12.5,color:C.sub}}>{bruker.epost}</div>
              </>
            ) : (
              <>
                <div style={{fontSize:15,fontWeight:800,color:C.text}}>Gjestebruker</div>
                <div style={{fontSize:12.5,color:C.sub}}>Ingen konto</div>
              </>
            )}
          </div>
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{fontSize:26,fontWeight:800,color:C.blue,lineHeight:1}}>{nivaa}</div>
            <div style={{fontSize:10.5,color:C.sub,fontWeight:700}}>NIVÅ</div>
          </div>
        </div>

        {/* XP-fremdriftslinje */}
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,color:C.sub,marginBottom:4}}>
            <span>{spiller.xp} XP</span>
            <span>{xpTil-spiller.xp} XP til nivå {nivaa+1}</span>
          </div>
          <div style={{height:8,background:C.bg,borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${xpPct}%`,background:C.blue,borderRadius:4,transition:"width .5s"}}/>
          </div>
        </div>

        {/* Handlingsknapper */}
        {bruker ? (
          <div style={{display:"flex",gap:8}}>
            <button style={{...sKnappSek,width:"auto",flex:1,padding:"9px 12px",fontSize:13}} onClick={()=>gaaTil({navn:"profilRediger"})}>Rediger</button>
            <button style={{...sKnappSek,width:"auto",flex:1,padding:"9px 12px",fontSize:13,color:C.err}} onClick={onLoggUt}>Logg ut</button>
          </div>
        ) : (
          <button style={sKnapp} onClick={()=>gaaTil({navn:"konto"})}>Logg inn eller opprett konto</button>
        )}
      </div>

      {/* ── Personlige innsikter ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div style={{...sCard,padding:14,textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:800,color:estimertSpart>0?C.ok:C.sub,lineHeight:1,marginBottom:2}}>
            {estimertSpart>0 ? ~${estimertSpart} kr : "–"}
          </div>
          <div style={{fontSize:11.5,color:C.sub,fontWeight:600}}>Estimert spart</div>
        </div>
        <div style={{...sCard,padding:14,textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:800,color:C.blue,lineHeight:1,marginBottom:2}}>{antallBidrag}</div>
          <div style={{fontSize:11.5,color:C.sub,fontWeight:600}}>Bidrag totalt</div>
        </div>
        <div style={{...sCard,padding:14,textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1,marginBottom:2}}>{favoritter.length}</div>
          <div style={{fontSize:11.5,color:C.sub,fontWeight:600}}>Favoritter</div>
        </div>
        <div style={{...sCard,padding:14,textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1,marginBottom:2}}>{butikkIds.length}</div>
          <div style={{fontSize:11.5,color:C.sub,fontWeight:600}}>Mine butikker</div>
        </div>
      </div>

      {/* ── Badges ── */}
      {opptjenteBadges.length>0 && (
        <div style={{...sCard,padding:16,marginBottom:14}}>
          <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 10px",color:C.text}}>🏅 Dine badges</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {opptjenteBadges.map(b=>(
              <div key={b.id} style={{background:C.blueLys,borderRadius:12,padding:"8px 12px",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:18}}>{b.ikon}</span>
                <div>
                  <div style={{fontSize:12.5,fontWeight:800,color:C.text}}>{b.tittel}</div>
                  <div style={{fontSize:11,color:C.sub}}>{b.beskrivelse}</div>
                </div>
              </div>
            ))}
          </div>
          {BADGES.length > opptjenteBadges.length && (
            <div style={{fontSize:12,color:C.sub,marginTop:10}}>
              {BADGES.length-opptjenteBadges.length} badge{BADGES.length-opptjenteBadges.length!==1?"s":""} gjenstår å låse opp
            </div>
          )}
        </div>
      )}

      {/* ── Neste belønning ── */}
      {klareBelonninger>0 && (
        <button onClick={()=>gaaTil({navn:"belonninger"})} style={{...sCard,padding:14,marginBottom:14,display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:`2px solid ${C.gull}`,background:"#fffdf0",width:"100%",textAlign:"left"}}>
          <span style={{fontSize:24}}>🎁</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13.5,fontWeight:800,color:C.text}}>{klareBelonninger} belønning{klareBelonninger>1?"er":""} klar!</div>
            <div style={{fontSize:12,color:C.sub}}>Trykk for å hente</div>
          </div>
          <span style={{color:C.gull,fontSize:18}}>→</span>
        </button>
      )}

      {/* ── Meny ── */}
      <div style={{...sCard,padding:"4px 16px",marginBottom:14}}>
        <MenyRad ikon="⭐" tittel="Favoritter" detalj={favoritter.length} onClick={()=>gaaTil({navn:"favoritter"})}/>
        <MenyRad ikon="📋" tittel="Mine lister" detalj={lister.length} onClick={()=>gaaTil({navn:"lister"})}/>
        <MenyRad ikon="🏪" tittel="Mine butikker" detalj={butikkIds.length} onClick={()=>gaaTil({navn:"butikker"})} siste/>
      </div>
      <div style={{...sCard,padding:"4px 16px",marginBottom:14}}>
        <MenyRad ikon="📈" tittel="Mine bidrag" detalj={`Nivå ${nivaa} · ${spiller.xp} XP`} onClick={()=>gaaTil({navn:"bidrag"})}/>
        <MenyRad ikon="🎁" tittel="Belønninger" detalj={klareBelonninger>0?`${klareBelonninger} klar${klareBelonninger>1?"e":""}`:null} onClick={()=>gaaTil({navn:"belonninger"})}/>
        <MenyRad ikon="👑" tittel="Premium" detalj={premiumAktiv?(premium.status==="gratis"?"Gratisperiode":"Aktiv"):"Ikke aktiv"} onClick={()=>gaaTil({navn:"premium"})}/>
        <MenyRad ikon="🔔" tittel="Varsler" detalj={uleste>0?`${uleste} nye`:null} onClick={()=>gaaTil({navn:"varsler"})} siste/>
      </div>
      <div style={{...sCard,padding:"4px 16px",marginBottom:14}}>
        <MenyRad ikon="📦" tittel="Foreslå nytt produkt" detalj="+25 XP" onClick={()=>gaaTil({navn:"foreslaaProdukt"})}/>
        <MenyRad ikon="🏬" tittel="Foreslå ny butikk" detalj="+25 XP" onClick={()=>gaaTil({navn:"foreslaaButikk"})}/>
        <MenyRad ikon="💬" tittel="Support" detalj={saker.filter(s=>s.status!=="Lukket"&&s.status!=="Løst").length||null} onClick={()=>gaaTil({navn:"support"})} siste/>
      </div>
      <div style={{...sCard,padding:"4px 16px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 2px",borderBottom:erAdmin?`1px solid ${C.border}`:"none"}}>
          <span style={{fontSize:19,width:26,textAlign:"center"}}>🛠️</span>
          <span style={{fontSize:14.5,fontWeight:700,color:C.text,flex:1}}>Administratormodus</span>
          <button onClick={onToggleAdmin} style={{width:46,height:26,borderRadius:13,border:"none",cursor:"pointer",background:erAdmin?C.blue:C.border,position:"relative",transition:"background .15s"}}>
            <span style={{position:"absolute",top:3,left:erAdmin?23:3,width:20,height:20,borderRadius:10,background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}/>
          </button>
        </div>
        {erAdmin && <MenyRad ikon="🗂️" tittel="Administrasjonspanel" detalj={adminTall>0?`${adminTall} i kø`:null} onClick={()=>gaaTil({navn:"admin"})} siste/>}
      </div>
      <div style={{...sCard,padding:18,marginBottom:14}}>
        <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 6px",color:C.text}}>Om Matpilot</h3>
        <p style={{fontSize:13,color:C.sub,margin:0,lineHeight:1.6}}>Demoversjon – data lagres lokalt på denne enheten. Administratormodus er åpen for testing.</p>
        <button style={{...lnk,marginTop:12}} onClick={onNullstill}>Nullstill app (kjør onboarding på nytt)</button>
      </div>
    </div>
  );
}

/* ════ HOVEDAPP ════ */
const LAGRINGSNOKKEL = "matpilot-v1";

function App(){
  const [fase,setFase] = useState("laster"); // laster | onboarding | app
  const [butikkIds,setButikkIds] = useState([]);
  const [tab,setTab] = useState("hjem");
  const [side,setSide] = useState(null); // {navn:"konto"|"profilRediger"|"favoritter"|"lister"|"liste"|"butikker", id?}
  const [aapenVare,setAapenVare] = useState(null);
  const [aapenArtikkel,setAapenArtikkel] = useState(null);
  const [favoritter,setFavoritter] = useState([]);
  const [kurv,setKurv] = useState({});
  const [lister,setLister] = useState([]);
  const [brukere,setBrukere] = useState([]);
  const [aktivBrukerId,setAktivBrukerId] = useState(null);
  const [listeVelger,setListeVelger] = useState(null); // vare-objekt
  const [nyListe,setNyListe] = useState(null); // {vareId: string|null}
  const [rapporter,setRapporter] = useState([]);
  const [bekreftelser,setBekreftelser] = useState([]);
  const [spiller,setSpiller] = useState({xp:0,tillit:50,historikk:[]});
  const [belonningStatus,setBelonningStatus] = useState({});
  const [premium,setPremium] = useState({status:"ingen"});
  const [varsler,setVarsler] = useState([]);
  const [ekteButikker, setEkteButikker] = useState([]);
  const [ekteButikkerLastet, setEkteButikkerLastet] = useState(false);
  const [rapporterVare,setRapporterVare] = useState(null);
  const [betaling,setBetaling] = useState(null); // "kjop" | "gratis"
  const [erAdmin,setErAdmin] = useState(false);
  const [produktForslag,setProduktForslag] = useState([]);
  const [butikkForslag,setButikkForslag] = useState([]);
  const [saker,setSaker] = useState([]);
  const [betalinger,setBetalinger] = useState([]);
  const [refusjoner,setRefusjoner] = useState([]);
  const [ekstraVarer,setEkstraVarer] = useState([]);
  const [ekstraButikker,setEkstraButikker] = useState([]);
  const [fjernedeVarer,setFjernedeVarer] = useState([]);
  const [fjernedeButikker,setFjernedeButikker] = useState([]);
  const [adminPriser,setAdminPriser] = useState({});
  const [bildeOverstyr,setBildeOverstyr] = useState({});
  const [maxButikker, setMaxButikker] = useState(1);
  const [nyligSett, setNyligSett] = useState([]);
  const [harSettGuide, setHarSettGuide] = useState(false);
  const [prisVersjon, setPrisVersjon] = useState(0);
  const [visGuide, setVisGuide] = useState(false);
  const [toast,setToast] = useState(null);

  // Last lagret tilstand
  useEffect(()=>{(async()=>{
    try{
      const r = await window.storage.get(LAGRINGSNOKKEL);
      if(r){
        const d = JSON.parse(r.value);
        setButikkIds(d.butikkIds||[]);
        setFavoritter(d.favoritter||[]);
        setKurv(d.kurv||{});
        setLister(d.lister||[]);
        setBrukere(d.brukere||[]);
        setAktivBrukerId(d.aktivBrukerId||null);
        setRapporter(d.rapporter||[]);
        setBekreftelser(d.bekreftelser||[]);
        setSpiller(d.spiller||{xp:0,tillit:50,historikk:[]});
        setBelonningStatus(d.belonningStatus||{});
        setPremium(d.premium||{status:"ingen"});
        setVarsler(d.varsler||[]);
        setErAdmin(!!d.erAdmin);
        setProduktForslag(d.produktForslag||[]);
        setButikkForslag(d.butikkForslag||[]);
        setSaker(d.saker||[]);
        setBetalinger(d.betalinger||[]);
        setRefusjoner(d.refusjoner||[]);
        setEkstraVarer(d.ekstraVarer||[]);
        setEkstraButikker(d.ekstraButikker||[]);
        setFjernedeVarer(d.fjernedeVarer||[]);
        setFjernedeButikker(d.fjernedeButikker||[]);
        setAdminPriser(d.adminPriser||{});
        setBildeOverstyr(d.bildeOverstyr||{});
        setHarSettGuide(!!d.harSettGuide);
        setFase(d.butikkIds?.length ? "app" : "onboarding");
        if(d.butikkIds?.length && !d.harSettGuide) setVisGuide(true);
        setTab("hjem"); // Alltid start på hjemskjermen
        return;
      }
    }catch(e){ /* ingen lagret tilstand ennå */ }
    setFase("onboarding");
  })()},[]);

  // Lagre tilstand
  useEffect(()=>{
    if(fase!=="app") return;
    (async()=>{
      try{ await window.storage.set(LAGRINGSNOKKEL, JSON.stringify({butikkIds,favoritter,kurv,lister,brukere,aktivBrukerId,rapporter,bekreftelser,spiller,belonningStatus,premium,varsler,erAdmin,produktForslag,butikkForslag,saker,betalinger,refusjoner,ekstraVarer,ekstraButikker,fjernedeVarer,fjernedeButikker,adminPriser,bildeOverstyr,harSettGuide})); }
      catch(e){ console.error("Lagring feilet",e); }
    })();
  },[fase,butikkIds,favoritter,kurv,lister,brukere,aktivBrukerId,rapporter,bekreftelser,spiller,belonningStatus,premium,varsler,erAdmin,produktForslag,butikkForslag,saker,betalinger,refusjoner,ekstraVarer,ekstraButikker,fjernedeVarer,fjernedeButikker,adminPriser,bildeOverstyr,harSettGuide]);

  // Last EAN-cache og start bakgrunnsoppdatering
  useEffect(()=>{
    if(fase!=="app") return;
    lastEanCache().then(()=>{ oppdaterEanCache(VARER, ()=>setPrisVersjon(v=>v+1)); });
  },[fase]);

  // Last ekte butikker – bruk cache hvis under 24 timer gammel
  useEffect(()=>{
    if(fase!=="app" || ekteButikkerLastet) return;
    setEkteButikkerLastet(true);
    (async()=>{
      try{
        // Sjekk lokal cache først
        const cache = await window.storage.get("matpilot-butikker-cache");
        if(cache){
          const {butikker, tid} = JSON.parse(cache.value);
          if(Date.now()-tid < 24*60*60*1000 && butikker.length > 100){
            setEkteButikker(butikker);
            return;
          }
        }
        // Cache utgått eller mangler – last fra proxy
        const butikker = await lastEkteButikker();
        if(butikker.length){
          setEkteButikker(butikker);
          await window.storage.set("matpilot-butikker-cache", JSON.stringify({butikker, tid:Date.now()}));
        }
      } catch(e){
        // Fallback: prøv uten cache
        const butikker = await lastEkteButikker();
        if(butikker.length) setEkteButikker(butikker);
      }
    })();
  },[fase]);
  const bruker = brukere.find(b=>b.id===aktivBrukerId) || null;
  const leggIKurv = (id)=>{ setKurv(p=>({...p,[id]:(p[id]||0)+1})); visToast("Lagt i handlekurven"); };
  const endreKurv = (id,delta)=>setKurv(p=>{
    const n = (p[id]||0)+delta;
    const kopi = {...p};
    if(n<=0) delete kopi[id]; else kopi[id]=n;
    return kopi;
  });
  const toggleFavoritt = (id)=>setFavoritter(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const antallIKurv = Object.values(kurv).reduce((a,b)=>a+b,0);

  /* — Lister — */
  const opprettListe = (navn, medVareId)=>{
    setLister(p=>[...p,{id:uid(),navn,varer:medVareId?[medVareId]:[],opprettet:Date.now()}]);
    setNyListe(null); setListeVelger(null);
    visToast(Listen «${navn}» er opprettet);
  };
  const leggVareIListe = (listeId, vareId)=>{
    const l = lister.find(x=>x.id===listeId);
    if(l && l.varer.includes(vareId)){ setListeVelger(null); visToast("Varen ligger allerede i listen"); return; }
    setLister(p=>p.map(x=>x.id===listeId?{...x,varer:[...x.varer,vareId]}:x));
    setListeVelger(null);
    visToast(Lagt til i «${l?l.navn:"listen"}»);
  };
  const endreListeNavn = (id,navn)=>{ setLister(p=>p.map(l=>l.id===id?{...l,navn}:l)); visToast("Navnet er lagret"); };
  const slettListe = (id)=>{ setLister(p=>p.filter(l=>l.id!==id)); setSide({navn:"lister"}); visToast("Listen er slettet"); };
  const fjernFraListe = (listeId,vareId)=>setLister(p=>p.map(l=>l.id===listeId?{...l,varer:l.varer.filter(v=>v!==vareId)}:l));
  const listeIKurv = (liste)=>{
    setKurv(p=>{ const k={...p}; liste.varer.forEach(id=>{k[id]=(k[id]||0)+1;}); return k; });
    visToast(${liste.varer.length} varer lagt i handlekurven);
  };

  /* — Konto (simulert) — */
  const loggInn = (epost,passord)=>{
    const b = brukere.find(x=>x.epost===epost);
    if(!b || b.passord!==passord) return "Feil e-post eller passord. Prøv igjen, eller bruk «Glemt passordet?».";
    setAktivBrukerId(b.id); setSide(null);
    visToast(Velkommen tilbake, ${b.navn.split(" ")[0]}!);
    return null;
  };
  const registrer = (navn,epost,passord)=>{
    if(brukere.some(x=>x.epost===epost)) return "Det finnes allerede en konto med denne e-postadressen. Logg inn i stedet.";
    const b = {id:uid(),navn,epost,passord,opprettet:Date.now()};
    setBrukere(p=>[...p,b]); setAktivBrukerId(b.id); setSide(null);
    visToast("Kontoen er opprettet");
    return null;
  };
  const nyttPassord = (epost,passord)=>setBrukere(p=>p.map(b=>b.epost===epost?{...b,passord}:b));
  const loggUt = ()=>{ setAktivBrukerId(null); visToast("Du er logget ut"); };
  const lagreProfil = (navn,epost)=>{
    if(brukere.some(b=>b.epost===epost && b.id!==aktivBrukerId)) return "E-postadressen er allerede i bruk på en annen konto.";
    setBrukere(p=>p.map(b=>b.id===aktivBrukerId?{...b,navn,epost}:b));
    setSide(null); visToast("Profilen er oppdatert");
    return null;
  };
  const aapneVare = (vare)=>{
    setAapenVare(vare);
    if(vare) setNyligSett(prev=>[vare.id,...prev.filter(id=>id!==vare.id)].slice(0,5));
  };
  const visToast = (t)=>{ setToast(t); setTimeout(()=>setToast(null),1900); };
  const leggVarsel = (tittel,tekst,nokkel)=>setVarsler(p=>p.some(v=>v.nokkel===nokkel)?p:[{id:uid(),nokkel,tid:naa(),tittel,tekst,lest:false},...p]);
  const merkVarslerLest = ()=>setVarsler(p=>p.some(v=>!v.lest)?p.map(v=>({...v,lest:true})):p);
  const endreTillit = (delta)=>setSpiller(p=>({...p,tillit:Math.max(0,Math.min(100,p.tillit+delta))}));
  const giXp = (poeng,tekst)=>{
    const forNivaa = xpTilNivaa(spiller.xp);
    const nyNivaa = xpTilNivaa(spiller.xp+poeng);
    setSpiller(p=>({...p,xp:p.xp+poeng,historikk:[{id:uid(),tid:naa(),tekst,xp:poeng},...p.historikk].slice(0,40)}));
    if(nyNivaa>forNivaa){
      const nye = BELONNINGER.filter(b=>b.level>forNivaa && b.level<=nyNivaa);
      if(nye.length){
        setBelonningStatus(s=>{ const k={...s}; nye.forEach(b=>{ if(!k[b.id]) k[b.id]={laastOpp:naa()}; }); return k; });
        nye.forEach(b=>leggVarsel(Belønning låst opp: ${b.tittel}, b.type==="premium1m"?"Aktiver den innen 30 dager under Profil → Belønninger.":"Se Profil → Belønninger.", "laast-opp-"+b.id));
      }
      visToast🎉 Du nådde nivå ${nyNivaa}!`);
    }
  };

  /* — Prisrapportering og verifisering — */
  const sendPrisrapport = ({butikkId,pris,bilde})=>{
    const vare = rapporterVare;
    const butikk = SEED_BUTIKKER.find(b=>b.id===butikkId);
    const hoyTillit = spiller.tillit>=66;
    setRapporter(p=>[{id:uid(),vareId:vare.id,butikkId,pris,bilde,tid:naa(),status:hoyTillit?"verifisert":"venter"},...p]);
    const forventet = (BASIS[vare.id]||pris)*(KJEDEFAKTOR[butikk.kjede]||1);
    const avvik = Math.abs(pris-forventet)/Math.max(forventet,1);
    if(avvik<=0.10) endreTillit(+2); else if(avvik>0.30) endreTillit(-3);
    setRapporterVare(null);
    visToast(hoyTillit?"Pris registrert som verifisert (høy tillit)":"Pris registrert – venter på bekreftelse");
    giXp(bilde?25:10, Prisrapport${bilde?" med bildebevis":""}: ${vare.navn});
  };
  const bekreftPris = (vare,butikkId)=>{
    setBekreftelser(p=>[...p,{vareId:vare.id,butikkId,tid:naa()}]);
    endreTillit(+1);
    visToast("Takk! Prisen er bekreftet");
    giXp(5,`Bekreftet pris: ${vare.navn}`);
  };

  /* — Belønninger og Premium — */
  const rabattKlar = !!(belonningStatus.r5?.aktivert && !belonningStatus.r5?.brukt);
  const premiumAktiv = premium.status==="gratis" || premium.status==="betalt";
  const aktiverRabatt = ()=>{ setBelonningStatus(s=>({...s,r5:{...s.r5,aktivert:naa()}})); visToast("Rabatten brukes på neste Premium-betaling"); };
  const kjopPremium = (kort)=>{
    const pris = rabattKlar?26:29;
    setPremium({status:"betalt",startet:naa(),fornyes:naa()+30*DAG,pris,kort,sagtOpp:false});
    setBetalinger(p=>[{id:uid(),tid:naa(),belop:pris,tekst:"Premium månedsabonnement"},...p]);
    if(rabattKlar) setBelonningStatus(s=>({...s,r5:{...s.r5,brukt:naa()}}));
    setBetaling(null); setSide({navn:"premium"});
    leggVarsel("Premium er aktivert",`Abonnementet fornyes automatisk hver måned. Si opp når som helst under Profil → Premium.`,"premium-start-"+naa());
    visToast("Velkommen til Premium!");
  };
  const startGratisPremium = (kort)=>{
    setPremium({status:"gratis",startet:naa(),sluttdato:naa()+30*DAG,prisEtter:29,kort,sagtOpp:false});
    setBelonningStatus(s=>({...s,r10:{...s.r10,aktivert:naa()}}));
    setBetaling(null); setSide({navn:"premium"});
    leggVarsel("Gratis Premium er aktivert","Gratisperioden varer i 30 dager. Etterpå fortsetter abonnementet automatisk til 29 kr/mnd, med mindre du sier opp.","premium-gratis-start");
    visToast("Gratis Premium er aktivert");
  };
  const siOppPremium = ()=>{ setPremium(p=>({...p,sagtOpp:true})); visToast("Abonnementet er sagt opp – tilgangen varer ut perioden"); };

  /* — Forslag (produkter og butikker) — */
  const sendProduktForslag = (f)=>{
    setProduktForslag(p=>[{...f,id:uid(),tid:naa(),status:"venter"},...p]);
    setSide(null); visToast("Produktforslaget er sendt til godkjenning");
  };
  const sendButikkForslag = (f)=>{
    setButikkForslag(p=>[{...f,id:uid(),tid:naa(),status:"venter"},...p]);
    setSide(null); visToast("Butikkforslaget er sendt til godkjenning");
  };
  const godkjennProdukt = (forslagId, red)=>{
    const f = produktForslag.find(x=>x.id===forslagId);
    const nyId = "bruker_"+uid();
    const harNaering = red.kcal||red.protein;
    setEkstraVarer(p=>[...p,{
      id:nyId, navn:red.navn.trim(), prod:red.prod?.trim()||"Ukjent", nova:red.nova?+red.nova:null, kat:red.kat,
      m: harNaering ? {kcal:+red.kcal||0,protein:+red.protein||0,fett:0,karbo:0,fiber:0,sukker:0} : undefined,
    }]);
    const pris = parseFloat(String(red.pris||"").replace(",","."));
    if(!isNaN(pris)&&pris>0&&f?.butikkId) setAdminPriser(p=>({...p,[nyId+"|"+f.butikkId]:{pris:Math.round(pris*100)/100,tid:naa()}}));
    setProduktForslag(p=>p.map(x=>x.id===forslagId?{...x,status:"godkjent"}:x));
    leggVarsel("Produktforslag godkjent",`«${red.navn}» er publisert og synlig for alle. +25 XP!`,"prod-ok-"+forslagId);
    visToast("Produktet er publisert");
    giXp(25,`Godkjent produktforslag: ${red.navn}`);
  };
  const godkjennButikk = (forslagId, red)=>{
    setEkstraButikker(p=>[...p,{id:"bruker_"+uid(),navn:red.navn.trim(),kjede:red.kjede,adresse:red.adresse?.trim()||"",sted:red.sted?.trim()||""}]);
    setButikkForslag(p=>p.map(x=>x.id===forslagId?{...x,status:"godkjent"}:x));
    leggVarsel("Butikkforslag godkjent",`«${red.navn}» er publisert og kan nå brukes til prisrapportering, som foretrukket butikk og i handlekurven. +25 XP!`,"butikk-ok-"+forslagId);
    visToast("Butikken er publisert");
    giXp(25,`Godkjent butikkforslag: ${red.navn}`);
  };
  const avvisForslag = (type, forslagId)=>{
    const sett = type==="produkt"?setProduktForslag:setButikkForslag;
    sett(p=>p.map(x=>x.id===forslagId?{...x,status:"avvist"}:x));
    endreTillit(-5);
    leggVarsel(type==="produkt"?"Produktforslag avvist":"Butikkforslag avvist","Forslaget ble ikke godkjent av administrator. Sjekk at informasjonen er korrekt og fullstendig.",type+"-avvist-"+forslagId);
    visToast("Forslaget er avvist");
  };
  const slaaSammenButikk = (forslagId, eksisterendeNavn)=>{
    setButikkForslag(p=>p.map(x=>x.id===forslagId?{...x,status:"sammenslått",med:eksisterendeNavn}:x));
    leggVarsel("Butikkforslag slått sammen",`Butikken du foreslo finnes allerede som «${eksisterendeNavn}», og forslaget er slått sammen med den.`,"butikk-merge-"+forslagId);
    visToast("Slått sammen med eksisterende butikk");
  };

  /* — Admin: priser, prisrapport-kø, produkter — */
  const settAdminPris = (vareId,butikkId,pris)=>{ setAdminPriser(p=>({...p,[vareId+"|"+butikkId]:{pris,tid:naa()}})); visToast("Pris lagret som verifisert"); };
  const slettPris = (vareId,butikkId)=>{ setAdminPriser(p=>({...p,[vareId+"|"+butikkId]:{slettet:true,tid:naa()}})); visToast("Prisen er slettet"); };
  const slettProdukt = (vareId)=>{
    if(vareId.startsWith("bruker_")) setEkstraVarer(p=>p.filter(v=>v.id!==vareId));
    else setFjernedeVarer(p=>[...p,vareId]);
    visToast("Produktet er fjernet fra katalogen");
  };
  const settBilde = (vareId,url)=>{ setBildeOverstyr(p=>({...p,[vareId]:url})); visToast("Produktbildet er oppdatert"); };
  const godkjennRapport = (id)=>{
    setRapporter(p=>p.map(r=>r.id===id?{...r,status:"verifisert"}:r));
    endreTillit(+2);
    leggVarsel("Prisrapport verifisert","En prisrapport du sendte inn er godkjent av administrator. Tilliten din øker.","rap-ok-"+id);
    visToast("Rapporten er verifisert");
  };
  const avvisRapport = (id)=>{
    setRapporter(p=>p.filter(r=>r.id!==id));
    endreTillit(-5);
    leggVarsel("Prisrapport avvist","En prisrapport du sendte inn ble avvist. Gjentatte avvisninger senker tilliten din.","rap-avvist-"+id);
    visToast("Rapporten er avvist og fjernet");
  };

  /* — Support — */
  const nySak = ({kategori,tekst,vedlegg})=>{
    setSaker(p=>[{id:uid(),kategori,tid:naa(),status:"Ny",meldinger:[{fra:"bruker",tekst,tid:naa(),vedlegg}]},...p]);
    visToast("Saken er opprettet – du får svar her i appen");
  };
  const svarSak = (sakId, fra, tekst)=>{
    setSaker(p=>p.map(s=>s.id===sakId?{...s,status:fra==="admin"?"Venter på bruker":"Under behandling",meldinger:[...s.meldinger,{fra,tekst,tid:naa()}]}:s));
    if(fra==="admin") leggVarsel("Nytt svar fra support","Du har fått svar i supportsaken din. Se Profil → Support.","sak-"+sakId+"-"+naa());
  };
  const settSakStatus = (sakId,status)=>setSaker(p=>p.map(s=>s.id===sakId?{...s,status}:s));

  /* — Refusjoner — */
  const utforRefusjon = ({brukerEpost,belop,begrunnelse,type})=>{
    const kode = type==="rabattkode" ? "MAT-"+uid().toUpperCase().slice(0,6) : undefined;
    setRefusjoner(p=>[{id:uid(),brukerEpost,belop,dato:naa(),begrunnelse,admin:bruker?bruker.navn:"Administrator",type,kode},...p]);
    if(type==="refusjon") leggVarsel("Refusjon utført",`${belop} kr er refundert til betalingskortet ditt. Begrunnelse: ${begrunnelse}.`,"ref-"+naa());
    if(type==="gratis_tid"){
      setPremium(p=> p.status==="betalt" ? {...p,fornyes:p.fornyes+30*DAG}
        : p.status==="gratis" ? {...p,sluttdato:p.sluttdato+30*DAG}
        : {status:"gratis",startet:naa(),sluttdato:naa()+30*DAG,prisEtter:29,kort:"–",sagtOpp:true});
      leggVarsel("Gratis abonnementstid","Support har gitt deg 30 dager gratis Premium.","gratis-"+naa());
    }
    if(type==="rabattkode") leggVarsel("Rabattkode fra support",`Du har fått rabattkoden ${kode}. (Demoversjon: koder kan ikke innløses ennå.)`,"kode-"+naa());
    visToast("Handlingen er utført og loggført");
  };

  // Tidsbaserte varsler og overganger (frister, gratisperiode, betaling)
  useEffect(()=>{
    if(fase!=="app") return;
    const t = naa();
    const r10 = belonningStatus.r10;
    if(r10 && !r10.aktivert){
      const frist = r10.laastOpp + 30*DAG;
      if(t>frist) leggVarsel("Belønning utløpt","1 måned gratis Premium ble ikke aktivert innen fristen på 30 dager.","r10-utlopt");
      else if(frist-t < 7*DAG) leggVarsel("Belønning utløper snart","Under 7 dager igjen til å aktivere 1 måned gratis Premium. Se Profil → Belønninger.","r10-snart");
    }
    if(premium.status==="gratis"){
      if(t>premium.sluttdato){
        if(premium.sagtOpp) setPremium({status:"ingen"});
        else {
          setPremium({status:"betalt",startet:premium.sluttdato,fornyes:premium.sluttdato+30*DAG,pris:premium.prisEtter,kort:premium.kort,sagtOpp:false});
          setBetalinger(p=>[{id:uid(),tid:premium.sluttdato,belop:premium.prisEtter,tekst:"Premium – første betaling etter gratisperiode"},...p]);
          leggVarsel("Første betaling er trukket",`Gratisperioden er over, og ${premium.prisEtter} kr er trukket fra ${premium.kort}.`,"premium-forste-trekk");
        }
      } else if(premium.sluttdato-t < 7*DAG){
        leggVarsel("Gratisperioden nærmer seg slutten",`Den ${dagTekst(premium.sluttdato)} trekkes første betaling på ${premium.prisEtter} kr, med mindre du sier opp under Profil → Premium.`,"premium-slutt-snart");
      }
    } else if(premium.status==="betalt" && !premium.sagtOpp && premium.fornyes>t && premium.fornyes-t < 3*DAG){
      leggVarsel("Betaling trekkes snart",`Den ${dagTekst(premium.fornyes)} trekkes ${premium.pris} kr for neste måned.`,"premium-fornyes-"+premium.fornyes);
    }
  },[fase,belonningStatus,premium]);

  const nullstill = async()=>{
    try{ await window.storage.delete(LAGRINGSNOKKEL); }catch(e){}
    setButikkIds([]); setFavoritter([]); setKurv({}); setLister([]); setBrukere([]); setAktivBrukerId(null);
    setRapporter([]); setBekreftelser([]); setSpiller({xp:0,tillit:50,historikk:[]});
    setBelonningStatus({}); setPremium({status:"ingen"}); setVarsler([]);
    setErAdmin(false); setProduktForslag([]); setButikkForslag([]); setSaker([]);
    setBetalinger([]); setRefusjoner([]); setEkstraVarer([]); setEkstraButikker([]);
    setFjernedeVarer([]); setFjernedeButikker([]); setAdminPriser({}); setBildeOverstyr({});
    setSide(null); setTab("produkter"); setFase("onboarding");
  };

  if(fase==="laster") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT,gap:20}}>
      <div style={{fontSize:52}}>🧭</div>
      <div style={{fontSize:22,fontWeight:800,color:C.text,letterSpacing:-0.5}}>Matpilot</div>
      <div style={{width:36,height:36,borderRadius:18,border:`3px solid ${C.border}`,borderTopColor:C.blue,animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if(fase==="onboarding") return <Onboarding onFerdig={(ids)=>{setButikkIds(ids);setFase("app");setVisGuide(true);}}/>;

  const TABS = [
    {id:"hjem",navn:"Hjem",ikon:Ikon.hjem},
    {id:"produkter",navn:"Produkter",ikon:Ikon.sok},
    {id:"kurv",navn:"Handlekurv",ikon:Ikon.kurv},
    {id:"kunnskap",navn:"Kunnskap",ikon:Ikon.bok},
    {id:"profil",navn:"Profil",ikon:Ikon.person},
  ];

  // Synkroniser ekte butikker til globalt array som prismotoren bruker
  if(ekteButikker.length){
    const eksisterendeNavn = new Set(ekteButikker.map(b=>(b.navn+b.kjede).toLowerCase()));
    const fraSeed = BUTIKKER_BASIS.filter(b=>!eksisterendeNavn.has((b.navn+b.kjede).toLowerCase()));
    SEED_BUTIKKER.length = 0;
    SEED_BUTIKKER.push(...ekteButikker, ...fraSeed);
  }

  settKatalog(ekstraVarer, ekstraButikker, fjernedeVarer, fjernedeButikker, bildeOverstyr);
  settPrisData(rapporter, bekreftelser, adminPriser);
  const pv = [rapporter.length,bekreftelser.length,ekstraVarer.length,ekstraButikker.length,fjernedeVarer.length,fjernedeButikker.length,Object.keys(adminPriser).length,Object.keys(bildeOverstyr).length,prisVersjon].join("-");
  const adminTall = {
    rapporter: rapporter.filter(r=>r.status==="venter").length,
    produkter: produktForslag.filter(f=>f.status==="venter").length,
    butikker: butikkForslag.filter(f=>f.status==="venter").length,
    saker: saker.filter(s=>s.status==="Ny"||s.status==="Under behandling").length,
  };
  const adminTallSum = adminTall.rapporter+adminTall.produkter+adminTall.butikker+adminTall.saker;

  let innhold;
  if(aapenVare){
    innhold = <ProduktDetalj vare={aapenVare} butikkIds={butikkIds} favoritt={favoritter.includes(aapenVare.id)}
      premium={premiumAktiv} pv={pv}
      onTilbake={()=>setAapenVare(null)} onLeggTil={()=>leggIKurv(aapenVare.id)}
      onFavoritt={()=>toggleFavoritt(aapenVare.id)} onLeggIListe={()=>setListeVelger(aapenVare)}
      onRapporter={()=>setRapporterVare(aapenVare)} onBekreft={(bid)=>bekreftPris(aapenVare,bid)}
      onAapne={(v)=>aapneVare(v)} onAapnePremium={()=>{setAapenVare(null);setSide({navn:"premium"});}}/>;
  } else if(aapenArtikkel){
    innhold = <ArtikkelVisning artikkel={aapenArtikkel} onTilbake={()=>setAapenArtikkel(null)}/>;
  } else if(side?.navn==="konto"){
    innhold = <KontoSide onTilbake={()=>setSide(null)} onLoggInn={loggInn} onRegistrer={registrer}
      onNyttPassord={nyttPassord} finnesEpost={(e)=>brukere.some(b=>b.epost===e)}/>;
  } else if(side?.navn==="profilRediger" && bruker){
    innhold = <ProfilRedigerSide bruker={bruker} onLagre={lagreProfil} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="tilbud"){
    innhold = <TilbudsSide butikkIds={butikkIds} rapporter={rapporter} pv={pv}
      onAapne={setAapenVare} onLeggTil={leggIKurv} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="favoritter"){
    innhold = <FavoritterSide favoritter={favoritter} butikkIds={butikkIds} pv={pv} onTilbake={()=>setSide(null)}
      onAapne={setAapenVare} onLeggTil={leggIKurv} onFavoritt={toggleFavoritt}
      onLeggAlleIKurv={(ids)=>{ ids.forEach(id=>leggIKurv(id)); visToast(${ids.length} favoritter lagt i handlekurven); }}/>;
  } else if(side?.navn==="bidrag"){
    innhold = <BidragSide spiller={spiller} rapporter={rapporter} bekreftelser={bekreftelser} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="belonninger"){
    innhold = <BelonningerSide spiller={spiller} belonningStatus={belonningStatus} premium={premium}
      onAktiverRabatt={aktiverRabatt} onStartGratis={()=>setBetaling("gratis")} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="premium"){
    innhold = <PremiumSide premium={premium} rabattKlar={rabattKlar} spiller={spiller} onKjop={()=>setBetaling("kjop")}
      onSiOpp={siOppPremium} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="varsler"){
    innhold = <VarslerSide varsler={varsler} onTilbake={()=>setSide(null)} onLes={merkVarslerLest}/>;
  } else if(side?.navn==="foreslaaProdukt"){
    innhold = <ForeslaaProduktSide butikkIds={butikkIds} onSend={sendProduktForslag} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="foreslaaButikk"){
    innhold = <ForeslaaButikkSide onSend={sendButikkForslag} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="support"){
    innhold = <SupportSide saker={saker} onNySak={nySak} onAapneSak={(id)=>setSide({navn:"sak",id})} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="sak"){
    const sak = saker.find(s=>s.id===side.id);
    innhold = sak
      ? <SakTraadSide key={sak.id} sak={sak} erAdmin={false} onSvar={(t)=>svarSak(sak.id,"bruker",t)} onTilbake={()=>setSide({navn:"support"})}/>
      : <SupportSide saker={saker} onNySak={nySak} onAapneSak={(id)=>setSide({navn:"sak",id})} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="admin" && erAdmin){
    innhold = <AdminSide tall={adminTall} gaaTil={setSide} onTilbake={()=>setSide(null)}/>;
  } else if(side?.navn==="adminProdukter" && erAdmin){
    innhold = <AdminProdukterSide pv={pv} rapporter={rapporter} onSettPris={settAdminPris} onSlettPris={slettPris}
      onSlettProdukt={slettProdukt} onSettBilde={settBilde} onTilbake={()=>setSide({navn:"admin"})}/>;
  } else if(side?.navn==="adminRapporter" && erAdmin){
    innhold = <AdminRapporterSide rapporter={rapporter} onGodkjenn={godkjennRapport} onAvvis={avvisRapport} onTilbake={()=>setSide({navn:"admin"})}/>;
  } else if(side?.navn==="adminDatakvalitet" && erAdmin){
    innhold = <AdminDatakvalitetSide rapporter={rapporter} onTilbake={()=>setSide({navn:"admin"})}/>;
  } else if(side?.navn==="adminProduktForslag" && erAdmin){
    innhold = <AdminProduktForslagSide forslag={produktForslag} onGodkjenn={godkjennProdukt}
      onAvvis={(id)=>avvisForslag("produkt",id)} onTilbake={()=>setSide({navn:"admin"})}/>;
  } else if(side?.navn==="adminButikkForslag" && erAdmin){
    innhold = <AdminButikkForslagSide forslag={butikkForslag} onGodkjenn={godkjennButikk}
      onAvvis={(id)=>avvisForslag("butikk",id)} onSlaaSammen={slaaSammenButikk} onTilbake={()=>setSide({navn:"admin"})}/>;
  } else if(side?.navn==="adminSupport" && erAdmin){
    innhold = <AdminSupportSide saker={saker} onAapne={(id)=>setSide({navn:"adminSak",id})} onTilbake={()=>setSide({navn:"admin"})}/>;
  } else if(side?.navn==="adminSak" && erAdmin){
    const sak = saker.find(s=>s.id===side.id);
    innhold = sak
      ? <SakTraadSide key={"a"+sak.id} sak={sak} erAdmin onSvar={(t)=>svarSak(sak.id,"admin",t)} onStatusEndre={(st)=>settSakStatus(sak.id,st)} onTilbake={()=>setSide({navn:"adminSupport"})}/>
      : <AdminSupportSide saker={saker} onAapne={(id)=>setSide({navn:"adminSak",id})} onTilbake={()=>setSide({navn:"admin"})}/>;
  } else if(side?.navn==="adminRefusjon" && erAdmin){
    innhold = <AdminRefusjonSide brukere={brukere} premium={premium} betalinger={betalinger} refusjoner={refusjoner}
      onUtfor={utforRefusjon} onTilbake={()=>setSide({navn:"admin"})}/>;
  } else if(side?.navn==="lister"){
    innhold = <ListerSide lister={lister} onTilbake={()=>setSide(null)}
      onAapneListe={(id)=>setSide({navn:"liste",id})} onNyListe={()=>setNyListe({vareId:null})}/>;
  } else if(side?.navn==="liste"){
    const l = lister.find(x=>x.id===side.id);
    innhold = l ? (
      <ListeDetalj key={l.id} liste={l} butikkIds={butikkIds} onTilbake={()=>setSide({navn:"lister"})}
        onEndreNavn={(navn)=>endreListeNavn(l.id,navn)} onSlett={()=>slettListe(l.id)}
        onFjern={(vid)=>fjernFraListe(l.id,vid)} onAapne={setAapenVare} onAltIKurv={()=>listeIKurv(l)}/>
    ) : (
      <ListerSide lister={lister} onTilbake={()=>setSide(null)}
        onAapneListe={(id)=>setSide({navn:"liste",id})} onNyListe={()=>setNyListe({vareId:null})}/>
    );
  } else if(side?.navn==="butikker"){
    innhold = <MineButikkerSide butikkIds={butikkIds} onTilbake={()=>setSide(null)}
      onLagre={(ids)=>{setButikkIds(ids);setSide(null);visToast("Butikkvalget er lagret");}}/>;
  } else {
    innhold = (
      <div style={{paddingBottom:86}}>
        {tab==="hjem" && <HjemSide bruker={bruker} butikkIds={butikkIds} kurv={kurv} favoritter={favoritter} lister={lister} pv={pv} premium={premiumAktiv} onAapne={aapneVare} onLeggTil={leggIKurv} onFavoritt={toggleFavoritt} onGaaTab={setTab} onAapneSide={setSide} nyligSett={nyligSett}/>}
        {tab==="produkter" && <ProdukterSide butikkIds={butikkIds} favoritter={favoritter} pv={pv} premium={premiumAktiv} onAapne={aapneVare} onLeggTil={leggIKurv} onFavoritt={toggleFavoritt}/>}
        {tab==="kurv" && <KurvSide kurv={kurv} butikkIds={butikkIds} pv={pv} onEndre={endreKurv} onAapne={aapneVare} maxButikker={maxButikker} setMaxButikker={setMaxButikker} onGaaTab={setTab}/>}
        {tab==="kunnskap" && <KunnskapSide onAapneArtikkel={setAapenArtikkel}/>}
        {tab==="profil" && <ProfilSide bruker={bruker} butikkIds={butikkIds} favoritter={favoritter} lister={lister}
          spiller={spiller} belonningStatus={belonningStatus} premium={premium} varsler={varsler}
          saker={saker} erAdmin={erAdmin} adminTall={adminTallSum}
          rapporter={rapporter} bekreftelser={bekreftelser}
          onToggleAdmin={()=>{ setErAdmin(a=>!a); visToast(erAdmin?"Administratormodus av":"Administratormodus på"); }}
          gaaTil={setSide} onLoggUt={loggUt} onNullstill={nullstill}/>}
        <nav style={{position:"fixed",left:0,right:0,bottom:0,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 18px",zIndex:10}}>
          {TABS.map(t=>{
            const aktiv = tab===t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 14px",position:"relative"}}>
                {aktiv && <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",width:28,height:3,borderRadius:2,background:C.blue}}/>}
                {t.ikon(aktiv?C.blue:C.sub)}
                {t.id==="kurv" && antallIKurv>0 && (
                  <span style={{position:"absolute",top:0,right:8,background:C.err,color:"#fff",borderRadius:9,minWidth:17,height:17,fontSize:10.5,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{antallIKurv}</span>
                )}
                <span style={{fontSize:10.5,fontWeight:aktiv?800:600,color:aktiv?C.blue:C.sub}}>{t.navn}</span>
              </button>
            );
          })}
        </nav>

        {/* Info-knapp – kun synlig på hjem-fanen */}
        {tab==="hjem" && (
          <button onClick={()=>setVisGuide(true)} style={{position:"fixed",top:16,right:16,zIndex:9,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,cursor:"pointer",padding:"4px 10px",display:"flex",alignItems:"center",gap:4,boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
            {Ikon.info()}
            <span style={{fontSize:11.5,fontWeight:700,color:C.sub}}>Guide</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT}}>
      {innhold}
      {listeVelger && (
        <ListeVelgerModal vare={listeVelger} lister={lister}
          onVelg={(listeId)=>leggVareIListe(listeId, listeVelger.id)}
          onNy={()=>setNyListe({vareId:listeVelger.id})}
          onLukk={()=>setListeVelger(null)}/>
      )}
      {nyListe && (
        <NyListeModal brukteNavn={lister.map(l=>l.navn)}
          onOpprett={(navn)=>opprettListe(navn, nyListe.vareId)}
          onLukk={()=>setNyListe(null)}/>
      )}
      {visGuide && (
        <GuideModal onLukk={()=>{ setVisGuide(false); setHarSettGuide(true); }}/>
      )}
      {rapporterVare && (
        <RapporterPrisModal vare={rapporterVare} butikkIds={butikkIds}
          onSend={sendPrisrapport} onLukk={()=>setRapporterVare(null)}/>
      )}
      {betaling==="kjop" && (
        <BetalingModal tittel="Start Premium"
          linjer={[`${rabattKlar?26:29} kr trekkes nå${rabattKlar?" (10 % rabatt første måned)":""}, deretter 29 kr hver måned`,"Abonnementet fornyes automatisk til du sier opp","Si opp når som helst under Profil → Premium"]}
          knapp={`Betal ${rabattKlar?26:29} kr og start Premium`}
          onBekreft={kjopPremium} onLukk={()=>setBetaling(null)}/>
      )}
      {betaling==="gratis" && (
        <BetalingModal tittel="Aktiver gratis Premium"
          linjer={["30 dager gratis – ingenting trekkes nå","Etter gratisperioden: 29 kr/mnd trekkes automatisk fra kortet","Si opp før gratisperioden er over for å unngå betaling"]}
          knapp="Registrer kort og start gratisperioden"
          onBekreft={startGratisPremium} onLukk={()=>setBetaling(null)}/>
      )}
      {toast && (
        <div style={{position:"fixed",bottom:110,left:"50%",transform:"translateX(-50%)",background:"rgba(16,24,40,0.92)",color:"#fff",borderRadius:12,padding:"11px 20px",fontSize:13.5,fontWeight:700,zIndex:80,boxShadow:"0 4px 20px rgba(0,0,0,0.25)",whiteSpace:"nowrap",animation:"fadeInUp 0.2s ease"}}>
          {toast}
        </div>
      )}
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Head>
        <title>Matpilot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="theme-color" content="#F6F7F9"/>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>"/>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #F6F7F9; overscroll-behavior: none; }`}</style>
      </Head>
      <App />
    </>
  );
}
