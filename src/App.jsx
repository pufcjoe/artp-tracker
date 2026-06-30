import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid,
} from "recharts";
import { Search, User, Users, Database, ChevronDown, TrendingUp, Crown } from "lucide-react";

/* ================================================================== *
 *  PR = decayed strength rating from real S8 placements.
 *  Per-result value uses the official ARTP point table; PR then
 *  decays continuously: 100% for 90 days, then a 360-day half-life.
 *  (Official ladder is separate: 26-week cliff for singles, season
 *   reset for doubles — not recomputed here, per request.)
 * ================================================================== */

const NOW = new Date("2026-06-30");
const GRACE_DAYS = 360;          // fixed full-credit window
const DAY = 86400000;

// official ARTP points by tier x round  (also the PR per-result base)
const PTS = {
  "Grand Slam": { W: 2000, F: 1200, SF: 720, QF: 360, R16: 180, R32: 90, R64: 45, R128: 20 },
  "Masters":    { W: 1000, F: 600,  SF: 360, QF: 180, R16: 90,  R32: 45 },
  "500":        { W: 500,  F: 300,  SF: 180, QF: 90,  R16: 45,  R32: 20 },
  "250":        { W: 250,  F: 150,  SF: 90,  QF: 45,  R16: 20,  R32: 10 },
  "Challenger": { W: 150,  F: 100,  SF: 75,  QF: 45,  R16: 25,  R32: 15 },
};
const ROUND_DEPTH = { W: 6, F: 5, SF: 4, QF: 3, R16: 2, R32: 1, R64: 0, RR: -1 };
const ROUND_LABEL = { W: "Champion", F: "Finalist", SF: "Semifinalist", QF: "Quarterfinalist", R16: "R16", R32: "R32", R64: "R64", RR: "RR" };

const ALIASES = {
  vitzaru: "vitzaru", vitzius: "vitzaru", joethepayne: "vitzaru", kunsaz: "vitzaru",
  major1klasy: "kuzuderee",
  vitzonlyjoshv: "vitzaru", vitzari: "vitzaru",
  flenxu: "flenxuu", ilyanasheii: "ilyanashei", xvxcai: "xvcxai", cristyvalentin: "cristy_valentin",
  khaledraii: "wingstopeffect", beardofglaz3: "wingstopeffect",
  batman_robuxrobin: "slowflin2442",
  lengku01: "lengku012", cristy_valentn: "cristy_valentin", tylerlikesair1: "tylerlikesair",
  andrewluvzgo: "andrewluvzgod", ambitiouscaleb: "ambitiouscalebb", steevs: "steezvs",
  xxx123phoneix123xx: "xxx123phoenix123xx", flenxugreatest: "flenxuu", flenxu_greatest: "flenxuu",
};

const FORCE_DISPLAY = {
  vitzaru: "vitzaru",
  slowflin2442: "Slowflin2442",
  kuzuderee: "kuzuderee",
};

const canon = (n) => { const k = n.trim().toLowerCase(); return ALIASES[k] || k; };
const ptsFor = (tier, round) => (PTS[tier] && PTS[tier][round]) || 0;
const decayW = (daysAgo, hl) => (daysAgo <= GRACE_DAYS ? 1 : Math.pow(0.5, (daysAgo - GRACE_DAYS) / hl));
const fmt = (n) => Math.round(n).toLocaleString("en-US");

const DEFAULT_DATA = `
D|2026-05-30|Grand Prix Hassan II Open|250|ilyAnashei|W|CaIvhin
D|2026-05-30|Grand Prix Hassan II Open|250|CaIvhin|W|ilyAnashei
D|2026-05-30|Grand Prix Hassan II Open|250|flenxuu|F|xvcxai
D|2026-05-30|Grand Prix Hassan II Open|250|xvcxai|F|flenxuu
D|2026-05-30|Grand Prix Hassan II Open|250|ogi_kingse|SF|Cristy_Valentin
D|2026-05-30|Grand Prix Hassan II Open|250|Cristy_Valentin|SF|ogi_kingse
D|2026-05-30|Grand Prix Hassan II Open|250|jjpunchercatpro2ban|SF|ilikegames_y
D|2026-05-30|Grand Prix Hassan II Open|250|ilikegames_y|SF|jjpunchercatpro2ban
D|2026-05-30|Grand Prix Hassan II Open|250|Das_tutWlan|QF|pankonikowski
D|2026-05-30|Grand Prix Hassan II Open|250|pankonikowski|QF|Das_tutWlan
D|2026-05-30|Grand Prix Hassan II Open|250|DFfixe|QF|uvis50k
D|2026-05-30|Grand Prix Hassan II Open|250|uvis50k|QF|DFfixe
D|2026-05-30|Grand Prix Hassan II Open|250|vitzaru|QF|goal_17
D|2026-05-30|Grand Prix Hassan II Open|250|goal_17|QF|vitzaru
D|2026-05-30|Grand Prix Hassan II Open|250|Voidicz|QF|kuzuderee
D|2026-05-30|Grand Prix Hassan II Open|250|kuzuderee|QF|Voidicz
D|2026-05-30|Grand Prix Hassan II Open|250|NT4_ALSHAROBLOX9|R16|SlowMo_PL
D|2026-05-30|Grand Prix Hassan II Open|250|SlowMo_PL|R16|NT4_ALSHAROBLOX9
D|2026-05-30|Grand Prix Hassan II Open|250|playgame_87|R16|SuperTopchikSS
D|2026-05-30|Grand Prix Hassan II Open|250|SuperTopchikSS|R16|playgame_87
D|2026-05-30|Grand Prix Hassan II Open|250|calImecoco|R16|lusadian12
D|2026-05-30|Grand Prix Hassan II Open|250|lusadian12|R16|calImecoco
D|2026-05-30|Grand Prix Hassan II Open|250|georgiepiggie|R16|iratehaspizza
D|2026-05-30|Grand Prix Hassan II Open|250|iratehaspizza|R16|georgiepiggie
S|2026-06-01|Libema Open|250|killzoneshade|W|
S|2026-06-01|Libema Open|250|kuzuderee|F|
S|2026-06-01|Libema Open|250|Das_tutWlan|SF|
S|2026-06-01|Libema Open|250|SlowMo_PL|SF|
S|2026-06-01|Libema Open|250|NT4_ALSHAROBLOX9|QF|
S|2026-06-01|Libema Open|250|Lygoh1|QF|
S|2026-06-01|Libema Open|250|magicbuilder5301|QF|
S|2026-06-01|Libema Open|250|Rdarggg|QF|
S|2026-06-01|Libema Open|250|Avant82|R16|
S|2026-06-01|Libema Open|250|fennecenfox|R16|
S|2026-06-01|Libema Open|250|ogi_kingse|R16|
S|2026-06-01|Libema Open|250|pumba20064|R16|
S|2026-06-01|Libema Open|250|lemgendarynaruto|R16|
S|2026-06-01|Libema Open|250|Cristy_Valentin|R16|
S|2026-06-01|Libema Open|250|77vuk|R16|
S|2026-06-01|Libema Open|250|tr1st4nxx|R16|
S|2026-06-01|Libema Open|250|Notvhiffgygybu|R32|
S|2026-05-31|Stuttgart Open|250|trollaso3089|W|
S|2026-05-31|Stuttgart Open|250|hoang2232|F|
S|2026-05-31|Stuttgart Open|250|georgiepiggie|SF|
S|2026-05-31|Stuttgart Open|250|ilikegames_y|SF|
S|2026-05-31|Stuttgart Open|250|Wyillis|QF|
S|2026-05-31|Stuttgart Open|250|tacoking457|QF|
S|2026-05-31|Stuttgart Open|250|flenxuu|QF|
S|2026-05-31|Stuttgart Open|250|vitzaru|QF|
S|2026-05-31|Stuttgart Open|250|theomegaplayer122|R16|
S|2026-05-31|Stuttgart Open|250|6Hermes|R16|
S|2026-05-31|Stuttgart Open|250|LuxDemon20|R16|
S|2026-05-31|Stuttgart Open|250|SamXTran|R16|
S|2026-05-31|Stuttgart Open|250|calImecoco|R16|
S|2026-05-31|Stuttgart Open|250|Eruica|R16|
S|2026-05-31|Stuttgart Open|250|jjpunchercatpro2ban|R16|
S|2026-05-31|Stuttgart Open|250|lego_your|R16|
S|2026-05-31|Stuttgart Open|250|borisbrana|R32|
S|2026-05-31|Stuttgart Open|250|Eashiss|R32|
S|2026-05-31|Stuttgart Open|250|Nxbxula|R32|
D|2026-05-03|Hamburg Open|500|ilyAnashei|W|CaIvhin
D|2026-05-03|Hamburg Open|500|CaIvhin|W|ilyAnashei
D|2026-05-03|Hamburg Open|500|flenxuu|F|vitzaru
D|2026-05-03|Hamburg Open|500|vitzaru|F|flenxuu
D|2026-05-03|Hamburg Open|500|ilovetennis678|SF|andrewluvzgod
D|2026-05-03|Hamburg Open|500|andrewluvzgod|SF|ilovetennis678
D|2026-05-03|Hamburg Open|500|jjpunchercatpro2ban|SF|ilikegames_y
D|2026-05-03|Hamburg Open|500|ilikegames_y|SF|jjpunchercatpro2ban
D|2026-05-03|Hamburg Open|500|wingstopeffect|QF|goal_17
D|2026-05-03|Hamburg Open|500|goal_17|QF|wingstopeffect
D|2026-05-03|Hamburg Open|500|NT4_ALSHAROBLOX9|QF|SlowMo_PL
D|2026-05-03|Hamburg Open|500|SlowMo_PL|QF|NT4_ALSHAROBLOX9
D|2026-05-03|Hamburg Open|500|yellowlemon123|QF|DFfixe
D|2026-05-03|Hamburg Open|500|DFfixe|QF|yellowlemon123
D|2026-05-03|Hamburg Open|500|Cristy_Valentin|QF|H0ll0WKEMP
D|2026-05-03|Hamburg Open|500|H0ll0WKEMP|QF|Cristy_Valentin
D|2026-05-03|Hamburg Open|500|Das_tutWlan|R16|pankonikowski
D|2026-05-03|Hamburg Open|500|pankonikowski|R16|Das_tutWlan
D|2026-05-03|Hamburg Open|500|onlybloxfruit_best|R16|CiaoMadaBambu2317Pew
D|2026-05-03|Hamburg Open|500|CiaoMadaBambu2317Pew|R16|onlybloxfruit_best
D|2026-05-03|Hamburg Open|500|trollaso3089|R16|lusadian12
D|2026-05-03|Hamburg Open|500|lusadian12|R16|trollaso3089
D|2026-05-03|Hamburg Open|500|kuzuderee|R16|Voidicz
D|2026-05-03|Hamburg Open|500|Voidicz|R16|kuzuderee
D|2026-05-03|Hamburg Open|500|playgame_87|R16|SuperTopchikSS
D|2026-05-03|Hamburg Open|500|SuperTopchikSS|R16|playgame_87
D|2026-05-03|Hamburg Open|500|georgiepiggie|R16|iratehaspizza
D|2026-05-03|Hamburg Open|500|iratehaspizza|R16|georgiepiggie
S|2026-05-04|Munich Open|500|SlowMo_PL|W|
S|2026-05-04|Munich Open|500|hoang2232|F|
S|2026-05-04|Munich Open|500|NT4_ALSHAROBLOX9|SF|
S|2026-05-04|Munich Open|500|trollaso3089|SF|
S|2026-05-04|Munich Open|500|fennecenfox|QF|
S|2026-05-04|Munich Open|500|Lygoh1|QF|
S|2026-05-04|Munich Open|500|lemgendarynaruto|QF|
S|2026-05-04|Munich Open|500|vitzaru|QF|
S|2026-05-04|Munich Open|500|nonotitan0003|R16|
S|2026-05-04|Munich Open|500|wzueki|R16|
S|2026-05-04|Munich Open|500|h2hvenom|R16|
S|2026-05-04|Munich Open|500|ilovetennis678|R16|
S|2026-05-04|Munich Open|500|kuzuderee|R16|
S|2026-05-04|Munich Open|500|Ave_TM|R16|
S|2026-05-04|Munich Open|500|calImecoco|R16|
S|2026-05-04|Munich Open|500|georgiepiggie|R16|
S|2026-05-04|Munich Open|500|sflynt|R32|
S|2026-05-04|Munich Open|500|Mr_George789|R32|
S|2026-05-04|Munich Open|500|h2handa|R32|
S|2026-05-04|Munich Open|500|mokilkopop|R32|
S|2026-05-03|Barcelona Open|500|Wyillis|W|
S|2026-05-03|Barcelona Open|500|jjpunchercatpro2ban|F|
S|2026-05-03|Barcelona Open|500|tacoking457|SF|
S|2026-05-03|Barcelona Open|500|flenxuu|SF|
S|2026-05-03|Barcelona Open|500|raphiprogamer|QF|
S|2026-05-03|Barcelona Open|500|Avant82|QF|
S|2026-05-03|Barcelona Open|500|BergeVo|QF|
S|2026-05-03|Barcelona Open|500|ilikegames_y|QF|
S|2026-05-03|Barcelona Open|500|killzoneshade|R16|
S|2026-05-03|Barcelona Open|500|6Hermes|R16|
S|2026-05-03|Barcelona Open|500|Rdarggg|R16|
S|2026-05-03|Barcelona Open|500|ciamioncino_17|R16|
S|2026-05-03|Barcelona Open|500|SimPlaysRblxYt|R16|
S|2026-05-03|Barcelona Open|500|pumba20064|R16|
S|2026-05-03|Barcelona Open|500|Cristy_Valentin|R16|
S|2026-05-03|Barcelona Open|500|Voidicz|R16|
S|2026-05-03|Barcelona Open|500|fiascio|R32|
S|2026-05-03|Barcelona Open|500|77vuk|R32|
S|2026-05-03|Barcelona Open|500|Lilman_95|R32|
S|2026-03-29|Indian Wells Open|Masters|flenxuu|W|
S|2026-03-29|Indian Wells Open|Masters|trollaso3089|F|
S|2026-03-29|Indian Wells Open|Masters|SlowMo_PL|SF|
S|2026-03-29|Indian Wells Open|Masters|vitzaru|SF|
S|2026-03-29|Indian Wells Open|Masters|fennecenfox|QF|
S|2026-03-29|Indian Wells Open|Masters|MAJOR1KLASY|QF|
S|2026-03-29|Indian Wells Open|Masters|davidkodavidko2|QF|
S|2026-03-29|Indian Wells Open|Masters|jjpunchercatpro2ban|QF|
S|2026-03-29|Indian Wells Open|Masters|wingstopeffect|R16|
S|2026-03-29|Indian Wells Open|Masters|NT4_ALSHAROBLOX9|R16|
S|2026-03-29|Indian Wells Open|Masters|jantargem|R16|
S|2026-03-29|Indian Wells Open|Masters|6Hermes|R16|
S|2026-03-29|Indian Wells Open|Masters|haiyu09|R16|
S|2026-03-29|Indian Wells Open|Masters|lemgendarynaruto|R16|
S|2026-03-29|Indian Wells Open|Masters|Cristy_Valentin|R16|
S|2026-03-29|Indian Wells Open|Masters|georgiepiggie|R16|
S|2026-03-29|Indian Wells Open|Masters|BergeVo|R32|
S|2026-03-29|Indian Wells Open|Masters|RZznknEGK|R32|
S|2026-03-29|Indian Wells Open|Masters|0xtek|R32|
D|2026-03-30|Italian Open|Masters|ilyAnashei|W|CaIvhin
D|2026-03-30|Italian Open|Masters|CaIvhin|W|ilyAnashei
D|2026-03-30|Italian Open|Masters|wingstopeffect|F|goal_17
D|2026-03-30|Italian Open|Masters|goal_17|F|wingstopeffect
D|2026-03-30|Italian Open|Masters|MAJOR1KLASY|SF|Voidicz
D|2026-03-30|Italian Open|Masters|Voidicz|SF|MAJOR1KLASY
D|2026-03-30|Italian Open|Masters|vitzaru|SF|Cristy_Valentin
D|2026-03-30|Italian Open|Masters|Cristy_Valentin|SF|vitzaru
D|2026-03-30|Italian Open|Masters|NoCapDroon|QF|TylerLikesAir1
D|2026-03-30|Italian Open|Masters|TylerLikesAir1|QF|NoCapDroon
D|2026-03-30|Italian Open|Masters|playgame_87|QF|SuperTopchikSS
D|2026-03-30|Italian Open|Masters|SuperTopchikSS|QF|playgame_87
D|2026-03-30|Italian Open|Masters|flenxuu|QF|zevillox
D|2026-03-30|Italian Open|Masters|zevillox|QF|flenxuu
D|2026-03-30|Italian Open|Masters|jjpunchercatpro2ban|QF|ilikegames_y
D|2026-03-30|Italian Open|Masters|ilikegames_y|QF|jjpunchercatpro2ban
D|2026-03-30|Italian Open|Masters|Malekabidi5|R16|davidkodavidko2
D|2026-03-30|Italian Open|Masters|davidkodavidko2|R16|Malekabidi5
D|2026-03-30|Italian Open|Masters|georgiepiggie|R16|iratehaspizza
D|2026-03-30|Italian Open|Masters|iratehaspizza|R16|georgiepiggie
S|2026-03-02|Dallas Open|500|flenxuu|W|
S|2026-03-02|Dallas Open|500|ilovetennis678|F|
S|2026-03-02|Dallas Open|500|ilikegames_y|SF|
S|2026-03-02|Dallas Open|500|vitzaru|SF|
S|2026-03-02|Dallas Open|500|trollaso3089|QF|
S|2026-03-02|Dallas Open|500|MAJOR1KLASY|QF|
S|2026-03-02|Dallas Open|500|SlowMo_PL|QF|
S|2026-03-02|Dallas Open|500|Slowflin2442|QF|
S|2026-03-02|Dallas Open|500|Milos_FullGaming|R16|
S|2026-03-02|Dallas Open|500|wzueki|R16|
S|2026-03-02|Dallas Open|500|avnerhik890|R16|
S|2026-03-02|Dallas Open|500|BergeVo|R16|
S|2026-03-02|Dallas Open|500|Lengku012|R16|
S|2026-03-02|Dallas Open|500|pumba20064|R16|
S|2026-03-02|Dallas Open|500|Cristy_Valentin|R16|
S|2026-03-02|Dallas Open|500|fennecenfox|R16|
S|2026-03-02|Dallas Open|500|ArthurNL777|R32|
S|2026-03-02|Dallas Open|500|NT4_ALSHAROBLOX9|R32|
S|2026-03-02|Dallas Open|500|isNotDennisZX|R32|
S|2026-03-02|Dallas Open|500|Avant82|R32|
S|2026-03-02|Dallas Open|500|FakeMegacardealer|R32|
S|2026-03-02|Dallas Open|500|0xtek|R32|
S|2026-03-02|Dallas Open|500|davidkodavidko2|R32|
S|2026-03-02|Dallas Open|500|jjpunchercatpro2ban|R32|
D|2026-03-02|Qatar Open|500|beardofglaz3|W|goal_17
D|2026-03-02|Qatar Open|500|goal_17|W|beardofglaz3
D|2026-03-02|Qatar Open|500|Slowflin2442|F|ilovetennis678
D|2026-03-02|Qatar Open|500|ilovetennis678|F|Slowflin2442
D|2026-03-02|Qatar Open|500|Cristy_Valentin|SF|Avant82
D|2026-03-02|Qatar Open|500|Avant82|SF|Cristy_Valentin
D|2026-03-02|Qatar Open|500|jjpunchercatpro2ban|SF|ilikegames_y
D|2026-03-02|Qatar Open|500|ilikegames_y|SF|jjpunchercatpro2ban
D|2026-03-02|Qatar Open|500|monkeyninja505|QF|andrewluvzgod
D|2026-03-02|Qatar Open|500|andrewluvzgod|QF|monkeyninja505
D|2026-03-02|Qatar Open|500|flenxuu|QF|xvcxai
D|2026-03-02|Qatar Open|500|xvcxai|QF|flenxuu
D|2026-03-02|Qatar Open|500|ReturnerByDeath|QF|SlowMo_PL
D|2026-03-02|Qatar Open|500|SlowMo_PL|QF|ReturnerByDeath
D|2026-03-02|Qatar Open|500|Voidicz|QF|MAJOR1KLASY
D|2026-03-02|Qatar Open|500|MAJOR1KLASY|QF|Voidicz
D|2026-03-02|Qatar Open|500|davidkodavidko2|R16|nefedovajulia
D|2026-03-02|Qatar Open|500|nefedovajulia|R16|davidkodavidko2
D|2026-01-27|Australian Open|Grand Slam|ilovetennis678|W|Batman_RobuxRobin
D|2026-01-27|Australian Open|Grand Slam|Batman_RobuxRobin|W|ilovetennis678
D|2026-01-27|Australian Open|Grand Slam|monkeyninja505|F|goal_17
D|2026-01-27|Australian Open|Grand Slam|goal_17|F|monkeyninja505
D|2026-01-27|Australian Open|Grand Slam|ilyAnashei|SF|Lengku012
D|2026-01-27|Australian Open|Grand Slam|Lengku012|SF|ilyAnashei
D|2026-01-27|Australian Open|Grand Slam|vitzaru|SF|flenxuu
D|2026-01-27|Australian Open|Grand Slam|flenxuu|SF|vitzaru
D|2026-01-27|Australian Open|Grand Slam|SlowMo_PL|QF|aleks_rudnik
D|2026-01-27|Australian Open|Grand Slam|aleks_rudnik|QF|SlowMo_PL
D|2026-01-27|Australian Open|Grand Slam|DFfixe|QF|yellowlemon123
D|2026-01-27|Australian Open|Grand Slam|yellowlemon123|QF|DFfixe
D|2026-01-27|Australian Open|Grand Slam|Cristy_Valentin|QF|Avant82
D|2026-01-27|Australian Open|Grand Slam|Avant82|QF|Cristy_Valentin
D|2026-01-27|Australian Open|Grand Slam|jjpunchercatpro2ban|QF|ilikegames_y
D|2026-01-27|Australian Open|Grand Slam|ilikegames_y|QF|jjpunchercatpro2ban
D|2026-01-27|Australian Open|Grand Slam|MAJOR1KLASY|R16|Voidicz
D|2026-01-27|Australian Open|Grand Slam|Voidicz|R16|MAJOR1KLASY
D|2026-01-27|Australian Open|Grand Slam|georgiepiggie|R16|Knightincool12
D|2026-01-27|Australian Open|Grand Slam|Knightincool12|R16|georgiepiggie
S|2026-01-30|Australian Open|Grand Slam|ilovetennis678|W|
S|2026-01-30|Australian Open|Grand Slam|trollaso3089|F|
S|2026-01-30|Australian Open|Grand Slam|goal_17|SF|
S|2026-01-30|Australian Open|Grand Slam|SlowMo_PL|SF|
S|2026-01-30|Australian Open|Grand Slam|Wyillis|QF|
S|2026-01-30|Australian Open|Grand Slam|pumba20064|QF|
S|2026-01-30|Australian Open|Grand Slam|ReturnerByDeath|QF|
S|2026-01-30|Australian Open|Grand Slam|Slowflin2442|QF|
S|2026-01-30|Australian Open|Grand Slam|Milos_FullGaming|R16|
S|2026-01-30|Australian Open|Grand Slam|wzueki|R16|
S|2026-01-30|Australian Open|Grand Slam|avnerhik890|R16|
S|2026-01-30|Australian Open|Grand Slam|xxx123phoenix123xx|R16|
S|2026-01-30|Australian Open|Grand Slam|MAJOR1KLASY|R16|
S|2026-01-30|Australian Open|Grand Slam|ilikegames_y|R16|
S|2026-01-30|Australian Open|Grand Slam|flenxuu|R16|
S|2026-01-30|Australian Open|Grand Slam|jjpunchercatpro2ban|R16|
S|2026-01-30|Australian Open|Grand Slam|fennecenfox|R32|
S|2026-01-30|Australian Open|Grand Slam|policeCOKE1|R32|
S|2026-01-30|Australian Open|Grand Slam|6Hermes|R32|
S|2026-01-30|Australian Open|Grand Slam|sflynt|R32|
S|2026-01-30|Australian Open|Grand Slam|Avant82|R32|
S|2026-01-30|Australian Open|Grand Slam|SimPlaysRblxYt|R32|
S|2026-01-30|Australian Open|Grand Slam|Lengku012|R32|
S|2026-01-30|Australian Open|Grand Slam|Olaf01837|R32|
S|2026-01-30|Australian Open|Grand Slam|PiesekMC|R32|
S|2026-01-30|Australian Open|Grand Slam|Cristy_Valentin|R32|
S|2026-01-30|Australian Open|Grand Slam|maksymilandr007|R32|
S|2026-01-30|Australian Open|Grand Slam|clashofclans12308|R32|
S|2026-01-30|Australian Open|Grand Slam|georgiepiggie|R32|
S|2026-01-30|Australian Open|Grand Slam|SUSSIESTLO|R32|
S|2026-01-30|Australian Open|Grand Slam|vitzaru|R32|
D|2025-12-06|Paris Masters|Masters|ilovetennis678|W|Batman_RobuxRobin
D|2025-12-06|Paris Masters|Masters|Batman_RobuxRobin|W|ilovetennis678
D|2025-12-06|Paris Masters|Masters|Cristy_Valentin|F|Avant82
D|2025-12-06|Paris Masters|Masters|Avant82|F|Cristy_Valentin
D|2025-12-06|Paris Masters|Masters|lusadian12|SF|Zevillox
D|2025-12-06|Paris Masters|Masters|Zevillox|SF|lusadian12
D|2025-12-06|Paris Masters|Masters|NoCapDroon|SF|TylerLikesAir
D|2025-12-06|Paris Masters|Masters|TylerLikesAir|SF|NoCapDroon
D|2025-12-06|Paris Masters|Masters|Milos_FullGaming|QF|ciamioncino_17
D|2025-12-06|Paris Masters|Masters|ciamioncino_17|QF|Milos_FullGaming
D|2025-12-06|Paris Masters|Masters|kobesur|QF|vitzari
D|2025-12-06|Paris Masters|Masters|vitzari|QF|kobesur
D|2025-12-06|Paris Masters|Masters|jjpunchercatpro2ban|QF|ilikegames_y
D|2025-12-06|Paris Masters|Masters|ilikegames_y|QF|jjpunchercatpro2ban
S|2025-12-04|Almaty Open|250|ilovetennis678|W|
S|2025-12-04|Almaty Open|250|Wyillis|F|
S|2025-12-04|Almaty Open|250|Olaf01837|SF|
S|2025-12-04|Almaty Open|250|ReturnerByDeath|SF|
S|2025-12-04|Almaty Open|250|goal_17|QF|
S|2025-12-04|Almaty Open|250|SlowMo_PL|QF|
S|2025-12-04|Almaty Open|250|Cristy_Valentin|QF|
S|2025-12-04|Almaty Open|250|ilikegames_y|QF|
S|2025-12-04|Almaty Open|250|Milos_FullGaming|R16|
S|2025-12-04|Almaty Open|250|wzueki|R16|
S|2025-12-04|Almaty Open|250|ciamioncino_17|R16|
S|2025-12-04|Almaty Open|250|SimPlaysRblxYt|R16|
S|2025-12-04|Almaty Open|250|xxx123phoenix123xx|R16|
S|2025-12-04|Almaty Open|250|MAJOR1KLASY|R16|
S|2025-12-04|Almaty Open|250|Batman_RobuxRobin|R16|
S|2025-12-04|Almaty Open|250|vitzari|R16|
S|2025-12-04|Almaty Open|250|raphiprogamer|R32|
S|2025-12-04|Almaty Open|250|Malekabidi5|R32|
S|2025-12-04|Almaty Open|250|Avant82|R32|
S|2025-12-04|Almaty Open|250|6Hermes|R32|
S|2025-12-04|Almaty Open|250|leilahcool|R32|
S|2025-12-04|Almaty Open|250|Qry_tps|R32|
S|2025-12-04|Almaty Open|250|jjpunchercatpro2ban|R32|
D|2025-11-02|Erste Bank Open|500|DFfixe|W|yellowlemon123
D|2025-11-02|Erste Bank Open|500|yellowlemon123|W|DFfixe
D|2025-11-02|Erste Bank Open|500|TylerLikesAir|F|NoCapDroon
D|2025-11-02|Erste Bank Open|500|NoCapDroon|F|TylerLikesAir
D|2025-11-02|Erste Bank Open|500|Jiaf3ipur|SF|EExaminare
D|2025-11-02|Erste Bank Open|500|EExaminare|SF|Jiaf3ipur
D|2025-11-02|Erste Bank Open|500|LittleDash3|SF|Adripavonpikachu
D|2025-11-02|Erste Bank Open|500|Adripavonpikachu|SF|LittleDash3
D|2025-11-02|Erste Bank Open|500|khaledraii|QF|SimmeBooga
D|2025-11-02|Erste Bank Open|500|SimmeBooga|QF|khaledraii
D|2025-11-02|Erste Bank Open|500|Cap7ainMGF|QF|Valerix173
D|2025-11-02|Erste Bank Open|500|Valerix173|QF|Cap7ainMGF
D|2025-11-02|Erste Bank Open|500|herrmitagee|QF|MAJOR1KLASY
D|2025-11-02|Erste Bank Open|500|MAJOR1KLASY|QF|herrmitagee
D|2025-11-02|Erste Bank Open|500|Cristy_Valentin|QF|Domnulinvizibil
D|2025-11-02|Erste Bank Open|500|Domnulinvizibil|QF|Cristy_Valentin
D|2025-11-02|Erste Bank Open|500|MIDISSE12|R16|k3tam_ine
D|2025-11-02|Erste Bank Open|500|k3tam_ine|R16|MIDISSE12
D|2025-11-02|Erste Bank Open|500|Khoavaid|R16|lusadian12
D|2025-11-02|Erste Bank Open|500|lusadian12|R16|Khoavaid
S|2025-10-27|Japan Open|500|ReturnerByDeath|W|
S|2025-10-27|Japan Open|500|Wyillis|F|
S|2025-10-27|Japan Open|500|SimPlaysRblxYt|SF|
S|2025-10-27|Japan Open|500|SlowMo_PL|SF|
S|2025-10-27|Japan Open|500|MAJOR1KLASY|QF|
S|2025-10-27|Japan Open|500|Olaf01837|QF|
S|2025-10-27|Japan Open|500|Batman_RobuxRobin|QF|
S|2025-10-27|Japan Open|500|vitzonlyjoshv|QF|
S|2025-10-27|Japan Open|500|6Hermes|R16|
S|2025-10-27|Japan Open|500|Avant82|R16|
S|2025-10-27|Japan Open|500|spiderporc1|R16|
S|2025-10-27|Japan Open|500|xxx123phoenix123xx|R16|
S|2025-10-27|Japan Open|500|Cristy_Valentin|R16|
S|2025-10-27|Japan Open|500|DOOOOOOG2813|R16|
S|2025-10-27|Japan Open|500|hoang2232|R16|
S|2025-10-27|Japan Open|500|ilikegames_y|R16|
S|2025-10-27|Japan Open|500|sflynt|R32|
S|2025-10-27|Japan Open|500|Zorroazul90|R32|
S|2025-10-27|Japan Open|500|LUcklpl|R32|
S|2025-10-27|Japan Open|500|MaximusM1350|R32|
S|2025-10-27|Japan Open|500|kacper6754|R32|
S|2025-10-27|Japan Open|500|MasalaHater|R32|
S|2025-10-27|Japan Open|500|PanPlacuszek24|R32|
S|2025-10-27|Japan Open|500|Qry_tps|R32|
S|2025-10-27|Japan Open|500|JMoneyWitDaBlic|R32|
D|2025-09-27|European Open|250|ilovetennis678|W|patrickomg6785
D|2025-09-27|European Open|250|patrickomg6785|W|ilovetennis678
D|2025-09-27|European Open|250|yellowlemon123|F|DFfixe
D|2025-09-27|European Open|250|DFfixe|F|yellowlemon123
D|2025-09-27|European Open|250|LittleDash3|SF|Adripavonpikachu
D|2025-09-27|European Open|250|Adripavonpikachu|SF|LittleDash3
D|2025-09-27|European Open|250|TylerLikesAir|SF|NoCapDroon
D|2025-09-27|European Open|250|NoCapDroon|SF|TylerLikesAir
D|2025-09-27|European Open|250|Cap7ainMGF|QF|Valerix173
D|2025-09-27|European Open|250|Valerix173|QF|Cap7ainMGF
D|2025-09-27|European Open|250|Cristy_Valentin|QF|Domnulinvizibil
D|2025-09-27|European Open|250|Domnulinvizibil|QF|Cristy_Valentin
D|2025-09-27|European Open|250|jjpunchercatpro2ban|QF|ilikegames_y
D|2025-09-27|European Open|250|ilikegames_y|QF|jjpunchercatpro2ban
D|2025-09-27|European Open|250|flenxuu|QF|barnenbeded
D|2025-09-27|European Open|250|barnenbeded|QF|flenxuu
D|2025-09-27|European Open|250|iratehaspizza|R16|natetheg14
D|2025-09-27|European Open|250|natetheg14|R16|iratehaspizza
D|2025-09-27|European Open|250|durdenbradley02|R16|fennecenfox
D|2025-09-27|European Open|250|fennecenfox|R16|durdenbradley02
D|2025-09-27|European Open|250|Xitz2020|R16|steelers081111
D|2025-09-27|European Open|250|steelers081111|R16|Xitz2020
D|2025-09-27|European Open|250|khoavaid|R16|lusadian12
D|2025-09-27|European Open|250|lusadian12|R16|khoavaid
S|2025-09-24|National Bank Open|Masters|Wyillis|W|
S|2025-09-24|National Bank Open|Masters|ReturnerByDeath|F|
S|2025-09-24|National Bank Open|Masters|Olaf01837|SF|
S|2025-09-24|National Bank Open|Masters|patrickomg6785|SF|
S|2025-09-24|National Bank Open|Masters|policeCOKE1|QF|
S|2025-09-24|National Bank Open|Masters|k3tam_ine|QF|
S|2025-09-24|National Bank Open|Masters|SlowMo_PL|QF|
S|2025-09-24|National Bank Open|Masters|Cristy_Valentin|QF|
S|2025-09-24|National Bank Open|Masters|killzoneshade|R16|
S|2025-09-24|National Bank Open|Masters|Avant82|R16|
S|2025-09-24|National Bank Open|Masters|j830_limed|R16|
S|2025-09-24|National Bank Open|Masters|avnerhik890|R16|
S|2025-09-24|National Bank Open|Masters|Cap7ainMGF|R16|
S|2025-09-24|National Bank Open|Masters|MAJOR1KLASY|R16|
S|2025-09-24|National Bank Open|Masters|MasalaHater|R16|
S|2025-09-24|National Bank Open|Masters|vitzonlyjoshv|R16|
S|2025-09-24|National Bank Open|Masters|Lvcurious|R32|
S|2025-09-29|Cincinnati Open|Masters|Batman_RobuxRobin|W|
S|2025-09-29|Cincinnati Open|Masters|ilovetennis678|F|
S|2025-09-29|Cincinnati Open|Masters|spiderporc1|SF|
S|2025-09-29|Cincinnati Open|Masters|ilikegames_y|SF|
S|2025-09-29|Cincinnati Open|Masters|SimPlaysRblxYt|QF|
S|2025-09-29|Cincinnati Open|Masters|ALEXKRZYWY124|QF|
S|2025-09-29|Cincinnati Open|Masters|hoang2232|QF|
S|2025-09-29|Cincinnati Open|Masters|flenxuu|QF|
S|2025-09-29|Cincinnati Open|Masters|thewishdonator1|R16|
S|2025-09-29|Cincinnati Open|Masters|Xinja_XiiYT|R16|
S|2025-09-29|Cincinnati Open|Masters|haiyu09|R16|
S|2025-09-29|Cincinnati Open|Masters|xxx123phoenix123xx|R16|
S|2025-09-29|Cincinnati Open|Masters|4yyce|R16|
S|2025-09-29|Cincinnati Open|Masters|Fennecenfox|R16|
S|2025-09-29|Cincinnati Open|Masters|Xitz2020|R16|
D|2025-08-18|Citi Open|500|goal_17|W|LeCarsnn
D|2025-08-18|Citi Open|500|LeCarsnn|W|goal_17
D|2025-08-18|Citi Open|500|Cristy_Valentin|F|Domnulinvizibil
D|2025-08-18|Citi Open|500|Domnulinvizibil|F|Cristy_Valentin
D|2025-08-18|Citi Open|500|TylerLikesAir|SF|NoCapDroon
D|2025-08-18|Citi Open|500|NoCapDroon|SF|TylerLikesAir
D|2025-08-18|Citi Open|500|flenxuu|SF|Das_TutWlan
D|2025-08-18|Citi Open|500|Das_TutWlan|SF|flenxuu
D|2025-08-18|Citi Open|500|Adripavonpikachu|QF|SimPlaysRblxYt
D|2025-08-18|Citi Open|500|SimPlaysRblxYt|QF|Adripavonpikachu
D|2025-08-18|Citi Open|500|yellowlemon123|QF|DFfixe
D|2025-08-18|Citi Open|500|DFfixe|QF|yellowlemon123
D|2025-08-18|Citi Open|500|davidkodavidko2|QF|nefedovajulia
D|2025-08-18|Citi Open|500|nefedovajulia|QF|davidkodavidko2
D|2025-08-18|Citi Open|500|ilovetennis678|QF|xvcxai
D|2025-08-18|Citi Open|500|xvcxai|QF|ilovetennis678
D|2025-08-18|Citi Open|500|nonotitan0003|R16|JaxioreeQ
D|2025-08-18|Citi Open|500|JaxioreeQ|R16|nonotitan0003
D|2025-08-18|Citi Open|500|Cap7ainMGF|R16|Valerix173
D|2025-08-18|Citi Open|500|Valerix173|R16|Cap7ainMGF
D|2025-08-18|Citi Open|500|Iratehaspizza|R16|natetheg14
D|2025-08-18|Citi Open|500|natetheg14|R16|Iratehaspizza
D|2025-08-18|Citi Open|500|NikolaPROsrb123|R16|imperator128
D|2025-08-18|Citi Open|500|imperator128|R16|NikolaPROsrb123
D|2025-08-18|Citi Open|500|jjpunchercatpro2ban|R16|WHYNOTMONEY5
D|2025-08-18|Citi Open|500|WHYNOTMONEY5|R16|jjpunchercatpro2ban
D|2025-08-18|Citi Open|500|xitz2020|R16|steelers081111
D|2025-08-18|Citi Open|500|steelers081111|R16|xitz2020
S|2025-08-22|Nordea Open|250|SlowMo_PL|W|
S|2025-08-22|Nordea Open|250|policeCOKE1|F|
S|2025-08-22|Nordea Open|250|Wyillis|SF|
S|2025-08-22|Nordea Open|250|xitz2020|SF|
S|2025-08-22|Nordea Open|250|Domnulinvizibil|QF|
S|2025-08-22|Nordea Open|250|Batman_RobuxRobin|QF|
S|2025-08-22|Nordea Open|250|lecarsnn|QF|
S|2025-08-22|Nordea Open|250|vitzonlyjoshv|QF|
S|2025-08-22|Nordea Open|250|bielarmani|R16|
S|2025-08-22|Nordea Open|250|Avant82|R16|
S|2025-08-22|Nordea Open|250|xxx123phoenix123xx|R16|
S|2025-08-22|Nordea Open|250|ALEXKRZYWY124|R16|
S|2025-08-22|Nordea Open|250|BorysNinja2011|R16|
S|2025-08-22|Nordea Open|250|Cristy_Valentin|R16|
S|2025-08-22|Nordea Open|250|EmmetStar|R16|
S|2025-08-22|Nordea Open|250|hoang2232|R16|
S|2025-08-22|Nordea Open|250|Innuendo_1991|R32|
S|2025-08-22|Nordea Open|250|Itz_Namanpreet|R32|
S|2025-08-22|Nordea Open|250|HowlOfTheDark|R32|
S|2025-08-22|Nordea Open|250|WHYNOTMONEY5|R32|
S|2025-08-17|Generali Open|250|ilovetennis678|W|
S|2025-08-17|Generali Open|250|ReturnerByDeath|F|
S|2025-08-17|Generali Open|250|Fennecenfox|SF|
S|2025-08-17|Generali Open|250|SimPlaysRblxYt|SF|
S|2025-08-17|Generali Open|250|Lvcurious|QF|
S|2025-08-17|Generali Open|250|Olaf01837|QF|
S|2025-08-17|Generali Open|250|davidkodavidko2|QF|
S|2025-08-17|Generali Open|250|flenxuu|QF|
S|2025-08-17|Generali Open|250|selz911|R16|
S|2025-08-17|Generali Open|250|sflynt|R16|
S|2025-08-17|Generali Open|250|goal_17|R16|
S|2025-08-17|Generali Open|250|nonotitan0003|R16|
S|2025-08-17|Generali Open|250|avnerhik890|R16|
S|2025-08-17|Generali Open|250|pippofil338|R16|
S|2025-08-17|Generali Open|250|CarKostas|R16|
S|2025-08-17|Generali Open|250|MrAyluin|R16|
S|2025-08-17|Generali Open|250|Cap7ainMGF|R32|
S|2025-08-17|Generali Open|250|MaximusM1350|R32|
S|2025-08-17|Generali Open|250|JaxioreeQ|R32|
S|2025-08-17|Generali Open|250|DOOOOOOG2812|R32|
S|2025-08-17|Generali Open|250|LeXXiZ|R32|
S|2025-08-17|Generali Open|250|Slow402|R32|
D|2025-07-07|Wimbledon Championships|Grand Slam|ilovetennis678|W|goal_17
D|2025-07-07|Wimbledon Championships|Grand Slam|goal_17|W|ilovetennis678
D|2025-07-07|Wimbledon Championships|Grand Slam|DFfixe|F|yellowlemon123
D|2025-07-07|Wimbledon Championships|Grand Slam|yellowlemon123|F|DFfixe
D|2025-07-07|Wimbledon Championships|Grand Slam|monkeyninja505|SF|AmbitiousCalebb
D|2025-07-07|Wimbledon Championships|Grand Slam|AmbitiousCalebb|SF|monkeyninja505
D|2025-07-07|Wimbledon Championships|Grand Slam|ilyAnashei|SF|Lengku012
D|2025-07-07|Wimbledon Championships|Grand Slam|Lengku012|SF|ilyAnashei
D|2025-07-07|Wimbledon Championships|Grand Slam|SimPlaysRblxYt|QF|LittleDash3
D|2025-07-07|Wimbledon Championships|Grand Slam|LittleDash3|QF|SimPlaysRblxYt
D|2025-07-07|Wimbledon Championships|Grand Slam|flenxuu|QF|Das_tutWlan
D|2025-07-07|Wimbledon Championships|Grand Slam|Das_tutWlan|QF|flenxuu
D|2025-07-07|Wimbledon Championships|Grand Slam|patrickomg6785|QF|halfidus_alt
D|2025-07-07|Wimbledon Championships|Grand Slam|halfidus_alt|QF|patrickomg6785
D|2025-07-07|Wimbledon Championships|Grand Slam|Zevillox|QF|MoonTheGoon1
D|2025-07-07|Wimbledon Championships|Grand Slam|MoonTheGoon1|QF|Zevillox
D|2025-07-07|Wimbledon Championships|Grand Slam|NT4_ALSHAROBLOX9|R16|PRI4776
D|2025-07-07|Wimbledon Championships|Grand Slam|PRI4776|R16|NT4_ALSHAROBLOX9
D|2025-07-07|Wimbledon Championships|Grand Slam|LST_Snipers|R16|ningafirestar5
D|2025-07-07|Wimbledon Championships|Grand Slam|ningafirestar5|R16|LST_Snipers
D|2025-07-07|Wimbledon Championships|Grand Slam|Cristy_Valentin|R16|Domnulinvizibil
D|2025-07-07|Wimbledon Championships|Grand Slam|Domnulinvizibil|R16|Cristy_Valentin
D|2025-07-07|Wimbledon Championships|Grand Slam|Hazbinhotelo|R16|kobersur
D|2025-07-07|Wimbledon Championships|Grand Slam|kobersur|R16|Hazbinhotelo
D|2025-07-07|Wimbledon Championships|Grand Slam|AndrewLuvzGod|R16|uvis50k
D|2025-07-07|Wimbledon Championships|Grand Slam|uvis50k|R16|AndrewLuvzGod
D|2025-07-07|Wimbledon Championships|Grand Slam|Barnenbeded|R16|Iratehaspizza
D|2025-07-07|Wimbledon Championships|Grand Slam|Iratehaspizza|R16|Barnenbeded
D|2025-07-07|Wimbledon Championships|Grand Slam|LeCarsnn|R16|darthezrah7
D|2025-07-07|Wimbledon Championships|Grand Slam|darthezrah7|R16|LeCarsnn
D|2025-07-07|Wimbledon Championships|Grand Slam|Aareilly|R16|lusadian12
D|2025-07-07|Wimbledon Championships|Grand Slam|lusadian12|R16|Aareilly
D|2025-07-07|Wimbledon Championships|Grand Slam|maven_076|R32|DerpyDarkR
D|2025-07-07|Wimbledon Championships|Grand Slam|DerpyDarkR|R32|maven_076
D|2025-07-07|Wimbledon Championships|Grand Slam|nonotitan0003|R32|JaxioreeQ
D|2025-07-07|Wimbledon Championships|Grand Slam|JaxioreeQ|R32|nonotitan0003
D|2025-07-07|Wimbledon Championships|Grand Slam|Cap7ainMGF|R32|Valerix173
D|2025-07-07|Wimbledon Championships|Grand Slam|Valerix173|R32|Cap7ainMGF
D|2025-07-07|Wimbledon Championships|Grand Slam|criyt456|R32|Diegoastro07
D|2025-07-07|Wimbledon Championships|Grand Slam|Diegoastro07|R32|criyt456
D|2025-07-07|Wimbledon Championships|Grand Slam|ALEXKRZYWY124|R32|Bedorckyt123
D|2025-07-07|Wimbledon Championships|Grand Slam|Bedorckyt123|R32|ALEXKRZYWY124
D|2025-07-07|Wimbledon Championships|Grand Slam|fashionzosia1|R32|LienPiece
D|2025-07-07|Wimbledon Championships|Grand Slam|LienPiece|R32|fashionzosia1
D|2025-07-07|Wimbledon Championships|Grand Slam|logoboko731|R32|Krondzio2
D|2025-07-07|Wimbledon Championships|Grand Slam|Krondzio2|R32|logoboko731
D|2025-07-07|Wimbledon Championships|Grand Slam|xyPixelz|R32|Redhartyboi
D|2025-07-07|Wimbledon Championships|Grand Slam|Redhartyboi|R32|xyPixelz
D|2025-07-07|Wimbledon Championships|Grand Slam|Not_Z3P|R32|vxmp_iana
D|2025-07-07|Wimbledon Championships|Grand Slam|vxmp_iana|R32|Not_Z3P
D|2025-07-07|Wimbledon Championships|Grand Slam|SamXTran|R32|yomiaz
D|2025-07-07|Wimbledon Championships|Grand Slam|yomiaz|R32|SamXTran
S|2025-07-21|Winnipeg National Bank Open|Challenger|vitzonlyjoshv|W|
S|2025-07-21|Winnipeg National Bank Open|Challenger|EmmetStar|F|
S|2025-07-21|Winnipeg National Bank Open|Challenger|CarKostas|SF|
S|2025-07-21|Winnipeg National Bank Open|Challenger|exulan2|SF|
S|2025-07-21|Winnipeg National Bank Open|Challenger|nonotitan0003|QF|
S|2025-07-21|Winnipeg National Bank Open|Challenger|Reversolity|QF|
S|2025-07-21|Winnipeg National Bank Open|Challenger|ConfusionIsDelusion|QF|
S|2025-07-21|Winnipeg National Bank Open|Challenger|Yomiaz|QF|
S|2025-07-21|Winnipeg National Bank Open|Challenger|sflynt|R16|
S|2025-07-21|Winnipeg National Bank Open|Challenger|EliteMastermind|R16|
S|2025-07-21|Winnipeg National Bank Open|Challenger|wzueki|R16|
S|2025-07-21|Winnipeg National Bank Open|Challenger|megacardealer|R16|
S|2025-07-21|Winnipeg National Bank Open|Challenger|pippofil338|R16|
S|2025-07-21|Winnipeg National Bank Open|Challenger|PiesekMC|R16|
S|2025-07-21|Winnipeg National Bank Open|Challenger|szymonbania33|R16|
S|2025-07-21|Winnipeg National Bank Open|Challenger|ddmg1|R16|
S|2025-07-21|Winnipeg National Bank Open|Challenger|maven_076|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|selz911|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|bielarmani|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|4polodu325|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|Lvcurious|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|Cap7ainMGF|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|MaximusM1350|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|eljoyerChan10|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|BorysNinja2011|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|Luckyvzz|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|Grimsical|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|Not_Z3P|R32|
S|2025-07-21|Winnipeg National Bank Open|Challenger|SamXTran|R32|
S|2025-05-24|Rome Open|Masters|policeCOKE1|W|
S|2025-05-24|Rome Open|Masters|Zevillox|F|
S|2025-05-24|Rome Open|Masters|spiderporc1|SF|
S|2025-05-24|Rome Open|Masters|Cristy_Valentin|SF|
S|2025-05-24|Rome Open|Masters|sflynt|QF|
S|2025-05-24|Rome Open|Masters|pippofil338|QF|
S|2025-05-24|Rome Open|Masters|ReturnerByDeath|QF|
S|2025-05-24|Rome Open|Masters|Seba2008ea|QF|
S|2025-05-24|Rome Open|Masters|avnerhik890|R16|
S|2025-05-24|Rome Open|Masters|SimPlaysRblxYt|R16|
S|2025-05-24|Rome Open|Masters|trollaso3089|R16|
S|2025-05-24|Rome Open|Masters|ALEXKRZYWY124|R16|
S|2025-05-24|Rome Open|Masters|Olaf01837|R16|
S|2025-05-24|Rome Open|Masters|PiesekMC|R16|
S|2025-05-24|Rome Open|Masters|ii_Dreadlord|R16|
S|2025-05-24|Rome Open|Masters|steezvs|R16|
S|2025-05-24|Rome Open|Masters|ptasa15|R32|
S|2025-05-24|Rome Open|Masters|Cap7ainMGF|R32|
S|2025-05-24|Rome Open|Masters|glamorousjasmine2009|R32|
S|2025-05-24|Rome Open|Masters|Levia21_All|R32|
D|2025-05-25|Geneva Open|250|Cristy_Valentn|W|MoonTheGoon1
D|2025-05-25|Geneva Open|250|MoonTheGoon1|W|Cristy_Valentn
D|2025-05-25|Geneva Open|250|ilovetennis678|F|LittleDaryl
D|2025-05-25|Geneva Open|250|LittleDaryl|F|ilovetennis678
D|2025-05-25|Geneva Open|250|ilyAnashei|SF|Lengku012
D|2025-05-25|Geneva Open|250|Lengku012|SF|ilyAnashei
D|2025-05-25|Geneva Open|250|andrewluvzgod|SF|goidfyre
D|2025-05-25|Geneva Open|250|goidfyre|SF|andrewluvzgod
D|2025-05-25|Geneva Open|250|Cap7ainMGF|QF|Valerix173
D|2025-05-25|Geneva Open|250|Valerix173|QF|Cap7ainMGF
D|2025-05-25|Geneva Open|250|patrickomg6785|QF|goal_17
D|2025-05-25|Geneva Open|250|goal_17|QF|patrickomg6785
D|2025-05-25|Geneva Open|250|DFfixe|QF|yellowlemon123
D|2025-05-25|Geneva Open|250|yellowlemon123|QF|DFfixe
D|2025-05-25|Geneva Open|250|flenxuu|QF|lusadian12
D|2025-05-25|Geneva Open|250|lusadian12|QF|flenxuu
D|2025-05-25|Geneva Open|250|killzoneshade|R16|RebeIinq
D|2025-05-25|Geneva Open|250|RebeIinq|R16|killzoneshade
D|2025-05-25|Geneva Open|250|EIiteMastermind|R16|oshoaIa
D|2025-05-25|Geneva Open|250|oshoaIa|R16|EIiteMastermind
D|2025-05-25|Geneva Open|250|Levia21_All|R16|Bkunuxk
D|2025-05-25|Geneva Open|250|Bkunuxk|R16|Levia21_All
D|2025-05-25|Geneva Open|250|SimPlaysRblxYt|R16|LittleDash3
D|2025-05-25|Geneva Open|250|LittleDash3|R16|SimPlaysRblxYt
D|2025-05-25|Geneva Open|250|LST_Snipers|R16|ningafirestar5
D|2025-05-25|Geneva Open|250|ningafirestar5|R16|LST_Snipers
D|2025-05-25|Geneva Open|250|Olaf01837|R16|ALEXKRZYWY124
D|2025-05-25|Geneva Open|250|ALEXKRZYWY124|R16|Olaf01837
S|2025-05-23|Mutua Madrid Open|Masters|goal_17|W|
S|2025-05-23|Mutua Madrid Open|Masters|BergeVo|F|
S|2025-05-23|Mutua Madrid Open|Masters|SlowMo_PL|SF|
S|2025-05-23|Mutua Madrid Open|Masters|ilovetennis678|SF|
S|2025-05-23|Mutua Madrid Open|Masters|MoonTheGoon1|QF|
S|2025-05-23|Mutua Madrid Open|Masters|Wyillis|QF|
S|2025-05-23|Mutua Madrid Open|Masters|xxx123phoenix123xx|QF|
S|2025-05-23|Mutua Madrid Open|Masters|ddmg1|QF|
S|2025-05-23|Mutua Madrid Open|Masters|LienPiece|R16|
S|2025-05-23|Mutua Madrid Open|Masters|haiyu09|R16|
S|2025-05-23|Mutua Madrid Open|Masters|Proxy10_1|R16|
S|2025-05-23|Mutua Madrid Open|Masters|Lengku012|R16|
S|2025-05-23|Mutua Madrid Open|Masters|patrickomg6785|R16|
S|2025-05-23|Mutua Madrid Open|Masters|Fennecenfox|R16|
S|2025-05-23|Mutua Madrid Open|Masters|flenxuu|R16|
S|2025-05-23|Mutua Madrid Open|Masters|vitzonlyjoshv|R16|
S|2025-05-23|Mutua Madrid Open|Masters|LittleJR20|R32|
S|2025-05-23|Mutua Madrid Open|Masters|killzoneshade|R32|
S|2025-05-23|Mutua Madrid Open|Masters|bielarmani|R32|
S|2025-05-23|Mutua Madrid Open|Masters|EliteMastermind|R32|
S|2025-05-23|Mutua Madrid Open|Masters|szymonbania33|R32|
S|2025-05-06|Morelos Open|Challenger|avnerhik890|W|
S|2025-05-06|Morelos Open|Challenger|CarKostas|F|
S|2025-05-06|Morelos Open|Challenger|ALEXKRZYWY124|SF|
S|2025-05-06|Morelos Open|Challenger|vitzonlyjoshv|SF|
S|2025-05-06|Morelos Open|Challenger|LienPiece|QF|
S|2025-05-06|Morelos Open|Challenger|Seba2008ea|QF|
S|2025-05-06|Morelos Open|Challenger|szymonbania33|QF|
S|2025-05-06|Morelos Open|Challenger|iamRonon|QF|
S|2025-05-06|Morelos Open|Challenger|Ziadgamer2021xd|R16|
S|2025-05-06|Morelos Open|Challenger|megacardealer|R16|
S|2025-05-06|Morelos Open|Challenger|Cap7ainMGF|R16|
S|2025-05-06|Morelos Open|Challenger|pippofil338|R16|
S|2025-05-06|Morelos Open|Challenger|LST_Snipers|R16|
S|2025-05-06|Morelos Open|Challenger|PiesekMC|R16|
S|2025-05-06|Morelos Open|Challenger|Luckyvzz|R16|
S|2025-05-06|Morelos Open|Challenger|LolaLtaccA|R16|
S|2025-05-06|Morelos Open|Challenger|cr1zt0ba1|R32|
S|2025-05-06|Morelos Open|Challenger|BasicallyInad|R32|
S|2025-05-06|Morelos Open|Challenger|chamaelontis|R32|
S|2025-05-06|Morelos Open|Challenger|glamorousjasmine2009|R32|
S|2025-05-06|Morelos Open|Challenger|Valerix173|R32|
S|2025-05-06|Morelos Open|Challenger|George892010|R32|
S|2025-05-06|Morelos Open|Challenger|PepsiColaSuper152|R32|
S|2025-05-06|Morelos Open|Challenger|ConfusionIsDelusion|R32|
S|2025-05-06|Morelos Open|Challenger|littlepotatoman28|R32|
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|steezvs|W|goidfyre
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|goidfyre|W|steezvs
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|ilovetennis678|F|LittleDaryl
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|LittleDaryl|F|ilovetennis678
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|ilyAnashei|SF|Lengku012
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|Lengku012|SF|ilyAnashei
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|DFfixe|SF|yellowlemon123
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|yellowlemon123|SF|DFfixe
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|LST_Snipers|QF|ningafirestar5
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|ningafirestar5|QF|LST_Snipers
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|AndrewLuvzGod|QF|ii_Dreadlord
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|ii_Dreadlord|QF|AndrewLuvzGod
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|Batman_RobuxRobin|QF|SwiftaIu
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|SwiftaIu|QF|Batman_RobuxRobin
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|patrickomg6785|QF|goal_17
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|goal_17|QF|patrickomg6785
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|Halfidus|R16|alienrchie
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|alienrchie|R16|Halfidus
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|trollaso3089|R16|AmbitiousCalebb
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|AmbitiousCalebb|R16|trollaso3089
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|ALEXKRZYWY124|R16|jantargem
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|jantargem|R16|ALEXKRZYWY124
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|Shadaurr|R16|Olaf01837
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|Olaf01837|R16|Shadaurr
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|Cristy_Valentn|R16|MoonTheGoon1
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|MoonTheGoon1|R16|Cristy_Valentn
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|fennecenfox|R16|durdenbradley02
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|durdenbradley02|R16|fennecenfox
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|flenxu_greatest|R16|Barnenbeded
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|Barnenbeded|R16|flenxu_greatest
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|zhodiyak|R16|vodiyak
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|vodiyak|R16|zhodiyak
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|danilefthanded|R32|jamonja3
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|jamonja3|R32|danilefthanded
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|lilila1222|R32|venaurr
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|venaurr|R32|lilila1222
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|kaguyashinomiya|R32|1kopt
D|2025-04-27|Rolex Monte-Carlo Masters|Masters|1kopt|R32|kaguyashinomiya
S|2025-04-27|Tiriac Open|250|policeCOKE1|W|
S|2025-04-27|Tiriac Open|250|MoonTheGoon1|F|
S|2025-04-27|Tiriac Open|250|patrickomg6785|SF|
S|2025-04-27|Tiriac Open|250|SlowMo_PL|SF|
S|2025-04-27|Tiriac Open|250|jantargem|QF|
S|2025-04-27|Tiriac Open|250|Olaf01837|QF|
S|2025-04-27|Tiriac Open|250|pumba20064|QF|
S|2025-04-27|Tiriac Open|250|ReturnerByDeath|QF|
S|2025-04-27|Tiriac Open|250|Avant82|R16|
S|2025-04-27|Tiriac Open|250|CarKostas|R16|
S|2025-04-27|Tiriac Open|250|AmbitiousCalebb|R16|
S|2025-04-27|Tiriac Open|250|ALEXKRZYWY124|R16|
S|2025-04-27|Tiriac Open|250|lilila1222|R16|
S|2025-04-27|Tiriac Open|250|PiesekMC|R16|
S|2025-04-27|Tiriac Open|250|Seba2008ea|R16|
S|2025-04-27|Tiriac Open|250|BergeVo|R16|
S|2025-04-27|Tiriac Open|250|CafePretzel|R32|
S|2025-04-27|Tiriac Open|250|pippofil338|R32|
S|2025-04-27|Tiriac Open|250|Lucasprozz1|R32|
S|2025-04-27|Tiriac Open|250|littlepotatoman28|R32|
S|2025-04-25|Grand Prix Hassan II|250|ilovetennis678|W|
S|2025-04-25|Grand Prix Hassan II|250|trollaso3089|F|
S|2025-04-25|Grand Prix Hassan II|250|Wyillis|SF|
S|2025-04-25|Grand Prix Hassan II|250|steezvs|SF|
S|2025-04-25|Grand Prix Hassan II|250|spiderporc1|QF|
S|2025-04-25|Grand Prix Hassan II|250|SimPlaysRblxYt|QF|
S|2025-04-25|Grand Prix Hassan II|250|xxx123phoenix123xx|QF|
S|2025-04-25|Grand Prix Hassan II|250|Batman_RobuxRobin|QF|
S|2025-04-25|Grand Prix Hassan II|250|CommanderHistorian|R16|
S|2025-04-25|Grand Prix Hassan II|250|LienPiece|R16|
S|2025-04-25|Grand Prix Hassan II|250|haiyu09|R16|
S|2025-04-25|Grand Prix Hassan II|250|avnerhik890|R16|
S|2025-04-25|Grand Prix Hassan II|250|Barnenbeded|R16|
S|2025-04-25|Grand Prix Hassan II|250|LST_Snipers|R16|
S|2025-04-25|Grand Prix Hassan II|250|fennecenfox|R16|
S|2025-04-25|Grand Prix Hassan II|250|flenxugreatest|R16|
S|2025-04-25|Grand Prix Hassan II|250|Vulmony|R32|
S|2025-04-25|Grand Prix Hassan II|250|danilefthanded|R32|
S|2025-04-25|Grand Prix Hassan II|250|megacardealer|R32|
S|2025-04-25|Grand Prix Hassan II|250|Pizza_alBalsamo15|R32|
S|2025-04-25|Grand Prix Hassan II|250|szymonbania33|R32|
S|2025-03-23|Miami Open|Masters|Wyillis|W|
S|2025-03-23|Miami Open|Masters|SlowMo_PL|F|
S|2025-03-23|Miami Open|Masters|policeCOKE1|SF|
S|2025-03-23|Miami Open|Masters|SimPlaysRblxYt|SF|
S|2025-03-23|Miami Open|Masters|haiyu09|QF|
S|2025-03-23|Miami Open|Masters|spiderporc1|QF|
S|2025-03-23|Miami Open|Masters|Olaf01837|QF|
S|2025-03-23|Miami Open|Masters|Fennecenfox|QF|
S|2025-03-23|Miami Open|Masters|CommanderHistorian|R16|
S|2025-03-23|Miami Open|Masters|Barnenbeded|R16|
S|2025-03-23|Miami Open|Masters|LST_Snipers|R16|
S|2025-03-23|Miami Open|Masters|ALEXKRZYWY124|R16|
S|2025-03-23|Miami Open|Masters|PiesekMC|R16|
S|2025-03-23|Miami Open|Masters|flenxu_greatest|R16|
S|2025-03-23|Miami Open|Masters|patrickomg6785|R16|
S|2025-03-23|Miami Open|Masters|steezvs|R16|
S|2025-03-23|Miami Open|Masters|RBL_Yurizinn|R32|
S|2025-03-23|Miami Open|Masters|jantargem|R32|
S|2025-03-23|Miami Open|Masters|DuckyIsNob|R32|
S|2025-03-23|Miami Open|Masters|BenjiDelMonte|R32|
S|2025-03-23|Miami Open|Masters|j830_limed|R32|
S|2025-03-23|Miami Open|Masters|xxx123phoenix123xx|R32|
S|2025-03-23|Miami Open|Masters|Kubcio12346|R32|
S|2025-03-23|Miami Open|Masters|bangrhythm68|R32|
S|2025-03-23|Miami Open|Masters|Spam_Ilovefood|R32|
D|2025-03-23|Dubai Duty Free|500|Lengku012|W|Ilyanashei
D|2025-03-23|Dubai Duty Free|500|Ilyanashei|W|Lengku012
D|2025-03-23|Dubai Duty Free|500|Cristy_Valentin|F|MoonTheGoon1
D|2025-03-23|Dubai Duty Free|500|MoonTheGoon1|F|Cristy_Valentin
D|2025-03-23|Dubai Duty Free|500|ilovetennis678|SF|LittleDaryl
D|2025-03-23|Dubai Duty Free|500|LittleDaryl|SF|ilovetennis678
D|2025-03-23|Dubai Duty Free|500|steevs|SF|ii_DreadLord
D|2025-03-23|Dubai Duty Free|500|ii_DreadLord|SF|steevs
D|2025-03-23|Dubai Duty Free|500|reaperneklud|QF|cocacola15236
D|2025-03-23|Dubai Duty Free|500|cocacola15236|QF|reaperneklud
D|2025-03-23|Dubai Duty Free|500|bangrhytm68|QF|JadedOut
D|2025-03-23|Dubai Duty Free|500|JadedOut|QF|bangrhytm68
D|2025-03-23|Dubai Duty Free|500|flenxu_greatest|QF|Spam_Ilovefood
D|2025-03-23|Dubai Duty Free|500|Spam_Ilovefood|QF|flenxu_greatest
D|2025-03-23|Dubai Duty Free|500|patrickomg6785|QF|goal_17
D|2025-03-23|Dubai Duty Free|500|goal_17|QF|patrickomg6785
D|2025-03-23|Dubai Duty Free|500|Wyillis|R16|jimmyzhao
D|2025-03-23|Dubai Duty Free|500|jimmyzhao|R16|Wyillis
D|2025-03-23|Dubai Duty Free|500|Barnenbeded|R16|Iratehaspizza
D|2025-03-23|Dubai Duty Free|500|Iratehaspizza|R16|Barnenbeded
D|2025-03-23|Dubai Duty Free|500|SimPlaysRblxYt|R16|MilanaMausi
D|2025-03-23|Dubai Duty Free|500|MilanaMausi|R16|SimPlaysRblxYt
D|2025-03-23|Dubai Duty Free|500|LST_Snipers|R16|ningafirestar5
D|2025-03-23|Dubai Duty Free|500|ningafirestar5|R16|LST_Snipers
D|2025-03-23|Dubai Duty Free|500|a5iaq|R16|iamRonon
D|2025-03-23|Dubai Duty Free|500|iamRonon|R16|a5iaq
D|2025-03-23|Dubai Duty Free|500|ALEXKRZYWY124|R16|jantargem
D|2025-03-23|Dubai Duty Free|500|jantargem|R16|ALEXKRZYWY124
D|2025-03-23|Dubai Duty Free|500|Matoki|R16|Njoradisio
D|2025-03-23|Dubai Duty Free|500|Njoradisio|R16|Matoki
D|2025-03-23|Dubai Duty Free|500|ZenitsuFlashh|R16|master1234y
D|2025-03-23|Dubai Duty Free|500|master1234y|R16|ZenitsuFlashh
S|2025-03-18|Thionville Challenger|Challenger|FilippANO09|W|
S|2025-03-18|Thionville Challenger|Challenger|Olaf01837|F|
S|2025-03-18|Thionville Challenger|Challenger|RBL_Yurizinn|SF|
S|2025-03-18|Thionville Challenger|Challenger|danilefthanded|SF|
S|2025-03-18|Thionville Challenger|Challenger|KL0AF|QF|
S|2025-03-18|Thionville Challenger|Challenger|LUcklpl|QF|
S|2025-03-18|Thionville Challenger|Challenger|ALEXKRZYWY124|QF|
S|2025-03-18|Thionville Challenger|Challenger|iamRonon|QF|
S|2025-03-18|Thionville Challenger|Challenger|sflynt|R16|
S|2025-03-18|Thionville Challenger|Challenger|Vulmony|R16|
S|2025-03-18|Thionville Challenger|Challenger|avnerhik890|R16|
S|2025-03-18|Thionville Challenger|Challenger|megacardealer|R16|
S|2025-03-18|Thionville Challenger|Challenger|LST_Snipers|R16|
S|2025-03-18|Thionville Challenger|Challenger|PiesekMC|R16|
S|2025-03-18|Thionville Challenger|Challenger|Njoradisio|R16|
S|2025-03-18|Thionville Challenger|Challenger|gamerroblox711|R16|
S|2025-03-18|Thionville Challenger|Challenger|redlared45|R32|
S|2025-03-18|Thionville Challenger|Challenger|Jaume10iJoan10|R32|
S|2025-03-18|Thionville Challenger|Challenger|GoldenAKJM|R32|
S|2025-03-18|Thionville Challenger|Challenger|Srinlr|R32|
S|2025-03-18|Thionville Challenger|Challenger|a5iaq|R32|
S|2025-03-18|Thionville Challenger|Challenger|Maatoki|R32|
S|2025-03-18|Thionville Challenger|Challenger|Blazennnnnn|R32|
S|2025-02-22|Qatar Exxonmobil Open|500|SlowMo_PL|W|
S|2025-02-22|Qatar Exxonmobil Open|500|aceelordd|F|
S|2025-02-22|Qatar Exxonmobil Open|500|Lengku012|SF|
S|2025-02-22|Qatar Exxonmobil Open|500|steezvs|SF|
S|2025-02-22|Qatar Exxonmobil Open|500|Swiftaiu|QF|
S|2025-02-22|Qatar Exxonmobil Open|500|Batman_RobuxRobin|QF|
S|2025-02-22|Qatar Exxonmobil Open|500|haiyu09|QF|
S|2025-02-22|Qatar Exxonmobil Open|500|HorseTranquilizer3|QF|
S|2025-02-22|Qatar Exxonmobil Open|500|FloTag|R16|
S|2025-02-22|Qatar Exxonmobil Open|500|trollaso3089|R16|
S|2025-02-22|Qatar Exxonmobil Open|500|ALEXKRZYWY124|R16|
S|2025-02-22|Qatar Exxonmobil Open|500|MasalaHater|R16|
S|2025-02-22|Qatar Exxonmobil Open|500|Olaf01837|R16|
S|2025-02-22|Qatar Exxonmobil Open|500|reaperneklud|R16|
S|2025-02-22|Qatar Exxonmobil Open|500|fennecenfox|R16|
S|2025-02-22|Qatar Exxonmobil Open|500|IuVec|R16|
S|2025-02-22|Qatar Exxonmobil Open|500|jantargem|R32|
S|2025-02-22|Qatar Exxonmobil Open|500|bielarmani|R32|
S|2025-02-22|Qatar Exxonmobil Open|500|Pizza_alBalsamo15|R32|
S|2025-02-22|Qatar Exxonmobil Open|500|siemsxhs|R32|
S|2025-02-22|Qatar Exxonmobil Open|500|durdenbradley02|R32|
D|2025-02-22|Open 13 Provence|250|LittleDaryl|W|ilovetennis678
D|2025-02-22|Open 13 Provence|250|ilovetennis678|W|LittleDaryl
D|2025-02-22|Open 13 Provence|250|patrickomg6785|F|goal_17
D|2025-02-22|Open 13 Provence|250|goal_17|F|patrickomg6785
D|2025-02-22|Open 13 Provence|250|AmbitiousCaleb|SF|lecarsnn
D|2025-02-22|Open 13 Provence|250|lecarsnn|SF|AmbitiousCaleb
D|2025-02-22|Open 13 Provence|250|Olaf01837|SF|Karolxdpozdro
D|2025-02-22|Open 13 Provence|250|Karolxdpozdro|SF|Olaf01837
D|2025-02-22|Open 13 Provence|250|ii_Dreadlord|QF|Trollaso3089
D|2025-02-22|Open 13 Provence|250|Trollaso3089|QF|ii_Dreadlord
D|2025-02-22|Open 13 Provence|250|Cristy_Valentin|QF|MoonTheGoon1
D|2025-02-22|Open 13 Provence|250|MoonTheGoon1|QF|Cristy_Valentin
D|2025-02-22|Open 13 Provence|250|fennecenfox|QF|durdenbradley02
D|2025-02-22|Open 13 Provence|250|durdenbradley02|QF|fennecenfox
D|2025-02-22|Open 13 Provence|250|Aareilly|QF|NitinTheGamer
D|2025-02-22|Open 13 Provence|250|NitinTheGamer|QF|Aareilly
D|2025-02-22|Open 13 Provence|250|LST_Snipers|R16|ningafirestar5
D|2025-02-22|Open 13 Provence|250|ningafirestar5|R16|LST_Snipers
D|2025-02-22|Open 13 Provence|250|Batman_RobuxRobin|R16|hvnstarz
D|2025-02-22|Open 13 Provence|250|hvnstarz|R16|Batman_RobuxRobin
D|2025-02-22|Open 13 Provence|250|flenxu_greatest|R16|Spam_Ilovefood
D|2025-02-22|Open 13 Provence|250|Spam_Ilovefood|R16|flenxu_greatest
D|2025-02-22|Open 13 Provence|250|ZenitsuFlashh|R16|master1234y
D|2025-02-22|Open 13 Provence|250|master1234y|R16|ZenitsuFlashh
D|2025-02-22|Open 13 Provence|250|lpdug|R16|skeletion282828
D|2025-02-22|Open 13 Provence|250|skeletion282828|R16|lpdug
D|2025-02-22|Open 13 Provence|250|steezvs|R16|goidfyre
D|2025-02-22|Open 13 Provence|250|goidfyre|R16|steezvs
S|2025-02-02|Tenerife Challenger|Challenger|avnerhik890|W|
S|2025-02-02|Tenerife Challenger|Challenger|cocacola15236|F|
S|2025-02-02|Tenerife Challenger|Challenger|j830_limed|SF|
S|2025-02-02|Tenerife Challenger|Challenger|PiesekMC|SF|
S|2025-02-02|Tenerife Challenger|Challenger|Ziadgamer2021xd|QF|
S|2025-02-02|Tenerife Challenger|Challenger|The_Cubee|QF|
S|2025-02-02|Tenerife Challenger|Challenger|LST_Snipers|QF|
S|2025-02-02|Tenerife Challenger|Challenger|Spam_Ilovefood|QF|
S|2025-02-02|Tenerife Challenger|Challenger|sflynt|R16|
S|2025-02-02|Tenerife Challenger|Challenger|crippledpug4922|R16|
S|2025-02-02|Tenerife Challenger|Challenger|CommanderHistorian|R16|
S|2025-02-02|Tenerife Challenger|Challenger|bielarmani|R16|
S|2025-02-02|Tenerife Challenger|Challenger|KL0AF|R16|
S|2025-02-02|Tenerife Challenger|Challenger|MasalaHater|R16|
S|2025-02-02|Tenerife Challenger|Challenger|Olaf01837|R16|
S|2025-02-02|Tenerife Challenger|Challenger|DOOOOOOG2812|R16|
S|2025-02-02|Tenerife Challenger|Challenger|S_p0rt|R32|
S|2025-02-02|Tenerife Challenger|Challenger|RBL_Yurizinn|R32|
S|2025-02-02|Tenerife Challenger|Challenger|aidenjrpl|R32|
S|2025-02-02|Tenerife Challenger|Challenger|Aheadteddy13|R32|
S|2025-02-02|Tenerife Challenger|Challenger|EmberCJH|R32|
S|2025-02-02|Tenerife Challenger|Challenger|MaximusM1350|R32|
S|2025-02-02|Tenerife Challenger|Challenger|ALEXKRZYWY124|R32|
S|2025-02-02|Tenerife Challenger|Challenger|zabka_jestem|R32|
S|2025-02-02|Tenerife Challenger|Challenger|Andre_Danzig|R32|
S|2025-02-02|Tenerife Challenger|Challenger|Achious|R32|
D|2025-01-12|Australian Open|Grand Slam|steezvs|W|goidfyre
D|2025-01-12|Australian Open|Grand Slam|goidfyre|W|steezvs
D|2025-01-12|Australian Open|Grand Slam|Lengku012|F|CaIvhin
D|2025-01-12|Australian Open|Grand Slam|CaIvhin|F|Lengku012
D|2025-01-12|Australian Open|Grand Slam|MoonTheGoon1|SF|Cristy_Valentin
D|2025-01-12|Australian Open|Grand Slam|Cristy_Valentin|SF|MoonTheGoon1
D|2025-01-12|Australian Open|Grand Slam|ilovetennis678|SF|ii_Dreadlord
D|2025-01-12|Australian Open|Grand Slam|ii_Dreadlord|SF|ilovetennis678
D|2025-01-12|Australian Open|Grand Slam|goal_17|QF|indkol22
D|2025-01-12|Australian Open|Grand Slam|indkol22|QF|goal_17
D|2025-01-12|Australian Open|Grand Slam|OrsoGamer20|QF|Pizza_alBalsamo15
D|2025-01-12|Australian Open|Grand Slam|Pizza_alBalsamo15|QF|OrsoGamer20
D|2025-01-12|Australian Open|Grand Slam|LST_Snipers|QF|ningafirestar5
D|2025-01-12|Australian Open|Grand Slam|ningafirestar5|QF|LST_Snipers
D|2025-01-12|Australian Open|Grand Slam|LittleDaryl|QF|Bugerzan
D|2025-01-12|Australian Open|Grand Slam|Bugerzan|QF|LittleDaryl
D|2025-01-12|Australian Open|Grand Slam|egomyfego|R16|andrewluvzgod
D|2025-01-12|Australian Open|Grand Slam|andrewluvzgod|R16|egomyfego
D|2025-01-12|Australian Open|Grand Slam|Batman_RobuxRobin|R16|TeleportationMan
D|2025-01-12|Australian Open|Grand Slam|TeleportationMan|R16|Batman_RobuxRobin
D|2025-01-12|Australian Open|Grand Slam|flenxu_greatest|R16|Spam_Ilovefood
D|2025-01-12|Australian Open|Grand Slam|Spam_Ilovefood|R16|flenxu_greatest
D|2025-01-12|Australian Open|Grand Slam|patrickomg6785|R16|flozuy
D|2025-01-12|Australian Open|Grand Slam|flozuy|R16|patrickomg6785
D|2025-01-12|Australian Open|Grand Slam|Supersecretagent07|R16|Ipdug
D|2025-01-12|Australian Open|Grand Slam|Ipdug|R16|Supersecretagent07
D|2025-01-12|Australian Open|Grand Slam|vnpthu|R16|alt_g
D|2025-01-12|Australian Open|Grand Slam|alt_g|R16|vnpthu
D|2025-01-12|Australian Open|Grand Slam|xhelloxLxettucex|R16|vxToad
D|2025-01-12|Australian Open|Grand Slam|vxToad|R16|xhelloxLxettucex
D|2025-01-12|Australian Open|Grand Slam|Zevillox|R16|HomelessGP
D|2025-01-12|Australian Open|Grand Slam|HomelessGP|R16|Zevillox
D|2025-01-12|Australian Open|Grand Slam|aidenjrpl|R32|crippledpug4922
D|2025-01-12|Australian Open|Grand Slam|crippledpug4922|R32|aidenjrpl
D|2025-01-12|Australian Open|Grand Slam|jantargem|R32|Creative_Jas0n
D|2025-01-12|Australian Open|Grand Slam|Creative_Jas0n|R32|jantargem
D|2025-01-12|Australian Open|Grand Slam|bielarmani|R32|DoomDystopian
D|2025-01-12|Australian Open|Grand Slam|DoomDystopian|R32|bielarmani
D|2025-01-12|Australian Open|Grand Slam|AmbitiousCalebb|R32|xvcxai
D|2025-01-12|Australian Open|Grand Slam|xvcxai|R32|AmbitiousCalebb
D|2025-01-12|Australian Open|Grand Slam|Olaf01837|R32|Zabka_jestem
D|2025-01-12|Australian Open|Grand Slam|Zabka_jestem|R32|Olaf01837
D|2025-01-12|Australian Open|Grand Slam|PiesekMC|R32|xMasterWert123
D|2025-01-12|Australian Open|Grand Slam|xMasterWert123|R32|PiesekMC
D|2025-01-12|Australian Open|Grand Slam|Lucky_ThePro|R32|Antichares
D|2025-01-12|Australian Open|Grand Slam|Antichares|R32|Lucky_ThePro
D|2025-01-12|Australian Open|Grand Slam|mepzzoctb|R32|aim_nexyita
D|2025-01-12|Australian Open|Grand Slam|aim_nexyita|R32|mepzzoctb
D|2025-01-12|Australian Open|Grand Slam|reaperneklud|R32|MrZentYT
D|2025-01-12|Australian Open|Grand Slam|MrZentYT|R32|reaperneklud
D|2025-01-12|Australian Open|Grand Slam|IuVec|R32|aceelordd
D|2025-01-12|Australian Open|Grand Slam|aceelordd|R32|IuVec
S|2025-02-21|Rio Open|500|ii_Dreadlord|W|
S|2025-02-21|Rio Open|500|policeCOKE1|F|
S|2025-02-21|Rio Open|500|MoonTheGoon1|SF|
S|2025-02-21|Rio Open|500|Zevillox|SF|
S|2025-02-21|Rio Open|500|xxx123phoneix123xx|QF|
S|2025-02-21|Rio Open|500|Jaume10iJoan10|QF|
S|2025-02-21|Rio Open|500|PiesekMC|QF|
S|2025-02-21|Rio Open|500|patrickomg6785|QF|
S|2025-02-21|Rio Open|500|CommanderHistorian|R16|
S|2025-02-21|Rio Open|500|avnerhik890|R16|
S|2025-02-21|Rio Open|500|spiderporc1|R16|
S|2025-02-21|Rio Open|500|SimPlaysRblxYt|R16|
S|2025-02-21|Rio Open|500|Marcin2590|R16|
S|2025-02-21|Rio Open|500|Cristy_Valentin|R16|
S|2025-02-21|Rio Open|500|Barnenbeded|R16|
S|2025-02-21|Rio Open|500|Aareilly|R16|
S|2025-02-21|Rio Open|500|yellowlemon123|R32|
S|2025-02-21|Rio Open|500|RBL_Yurizinn|R32|
S|2025-02-21|Rio Open|500|raphiprogamer|R32|
S|2025-02-21|Rio Open|500|KL0AF|R32|
S|2025-02-21|Rio Open|500|FilippANO09|R32|
S|2025-02-21|Rio Open|500|The_Cubee|R32|
S|2025-02-21|Rio Open|500|LUcklpl|R32|
S|2025-02-21|Rio Open|500|LST_Snipers|R32|
S|2025-02-21|Rio Open|500|pumba20064|R32|
S|2025-02-21|Rio Open|500|flenxu_greatest|R32|
S|2025-02-21|Rio Open|500|lpdug|R32|
S|2026-02-07|ARTP Finals S7|Finals|ilovetennis678|W||1000
S|2026-02-07|ARTP Finals S7|Finals|SlowMo_PL|F||700
S|2026-02-07|ARTP Finals S7|Finals|goal_17|SF||450
S|2026-02-07|ARTP Finals S7|Finals|Batman_RobuxRobin|SF||450
S|2026-02-07|ARTP Finals S7|Finals|ReturnerByDeath|RR||100
S|2026-02-07|ARTP Finals S7|Finals|Olaf01837|RR||0
S|2026-02-07|ARTP Finals S7|Finals|Wyillis|RR||100
S|2026-02-07|ARTP Finals S7|Finals|policeCOKE1|RR||0
D|2026-02-15|ARTP Finals S7|Finals|ilovetennis678|W|Batman_RobuxRobin|1000
D|2026-02-15|ARTP Finals S7|Finals|Batman_RobuxRobin|W|ilovetennis678|1000
D|2026-02-15|ARTP Finals S7|Finals|DFfixe|F|yellowlemon123|700
D|2026-02-15|ARTP Finals S7|Finals|yellowlemon123|F|DFfixe|700
D|2026-02-15|ARTP Finals S7|Finals|ilyAnashei|SF|Lengku01|450
D|2026-02-15|ARTP Finals S7|Finals|Lengku01|SF|ilyAnashei|450
D|2026-02-15|ARTP Finals S7|Finals|flenxuu|SF|Das_tutWlan|450
D|2026-02-15|ARTP Finals S7|Finals|Das_tutWlan|SF|flenxuu|450
D|2026-02-15|ARTP Finals S7|Finals|TylerLikesAir|RR|NoCapDroon|100
D|2026-02-15|ARTP Finals S7|Finals|NoCapDroon|RR|TylerLikesAir|100
D|2026-02-15|ARTP Finals S7|Finals|monkeyninja505|RR|AmbitiousCalebb|0
D|2026-02-15|ARTP Finals S7|Finals|AmbitiousCalebb|RR|monkeyninja505|0
D|2026-02-15|ARTP Finals S7|Finals|goal_17|RR|LeCarsnn|100
D|2026-02-15|ARTP Finals S7|Finals|LeCarsnn|RR|goal_17|100
D|2026-02-15|ARTP Finals S7|Finals|Cristy_Valentin|RR|Avant82|0
D|2026-02-15|ARTP Finals S7|Finals|Avant82|RR|Cristy_Valentin|0
D|2025-07-09|ARTP Finals S6|Finals|Lengku012|W|Ilyanashei|1000
D|2025-07-09|ARTP Finals S6|Finals|Ilyanashei|W|Lengku012|1000
D|2025-07-09|ARTP Finals S6|Finals|patrickomg6785|F|goal_17|600
D|2025-07-09|ARTP Finals S6|Finals|goal_17|F|patrickomg6785|600
D|2025-07-09|ARTP Finals S6|Finals|DFfixe|SF|yellowlemon123|550
D|2025-07-09|ARTP Finals S6|Finals|yellowlemon123|SF|DFfixe|550
D|2025-07-09|ARTP Finals S6|Finals|Batman_RobuxRobin|SF|SwiftaIu|450
D|2025-07-09|ARTP Finals S6|Finals|SwiftaIu|SF|Batman_RobuxRobin|450
D|2025-07-09|ARTP Finals S6|Finals|MoonTheGoon1|RR|Cristy_Valentin|100
D|2025-07-09|ARTP Finals S6|Finals|Cristy_Valentin|RR|MoonTheGoon1|100
D|2025-07-09|ARTP Finals S6|Finals|LST_Snipers|RR|ningafirestar5|0
D|2025-07-09|ARTP Finals S6|Finals|ningafirestar5|RR|LST_Snipers|0
D|2025-07-09|ARTP Finals S6|Finals|egomyfego|RR|andrewluvzgo|100
D|2025-07-09|ARTP Finals S6|Finals|andrewluvzgo|RR|egomyfego|100
D|2025-07-09|ARTP Finals S6|Finals|Zevillox|RR|HomelessGP|0
D|2025-07-09|ARTP Finals S6|Finals|HomelessGP|RR|Zevillox|0
S|2025-07-08|ARTP Finals S6|Finals|ilovetennis678|W||1000
S|2025-07-08|ARTP Finals S6|Finals|goal_17|F||700
S|2025-07-08|ARTP Finals S6|Finals|SlowMo_PL|SF||450
S|2025-07-08|ARTP Finals S6|Finals|MoonTheGoon1|SF||450
S|2025-07-08|ARTP Finals S6|Finals|policeCOKE1|RR||100
S|2025-07-08|ARTP Finals S6|Finals|Lengku012|RR||0
S|2025-07-08|ARTP Finals S6|Finals|Wyillis|RR||100
S|2025-07-08|ARTP Finals S6|Finals|Zevillox|RR||0
`;

/* ------------------------------------------------------------------ */
function parseRows(text) {
  const out = [];
  text.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const c = t.split("|");
    if (c.length < 6) return;
    const [mode, date, tournament, tier, player, round, partner = "", ov = ""] = c.map((x) => x.trim());
    if ((!PTS[tier] && tier !== "Finals") || ROUND_DEPTH[round] === undefined) return;
    out.push({ mode: /^d/i.test(mode) ? "D" : "S", date, ms: new Date(date).getTime(), tournament, tier,
      player, key: canon(player), round, partner, pts: ov !== "" ? +ov : ptsFor(tier, round) });
  });
  return out;
}

function monthlyTicks(minMs) {
  const ticks = [];
  const d = new Date(minMs); d.setDate(1);
  const end = NOW.getTime();
  while (d.getTime() <= end) { ticks.push(d.getTime()); d.setMonth(d.getMonth() + 1); }
  if (ticks[ticks.length - 1] !== end) ticks.push(end);
  return ticks;
}

function buildModel(rows, mode, hl) {
  const data = rows.filter((r) => r.mode === mode);
  if (!data.length) return { ranked: [], byKey: {}, field: 0, tournaments: 0 };
  const ticks = monthlyTicks(Math.min(...data.map((r) => r.ms)));

  const groups = {};
  data.forEach((r) => { (groups[r.key] = groups[r.key] || []).push(r); });

  const profiles = Object.entries(groups).map(([key, list]) => {
    list.sort((a, b) => a.ms - b.ms);
    const display = FORCE_DISPLAY[key] || list[0].player;
    const series = ticks.map((t) => {
      let pr = 0;
      for (const r of list) { if (r.ms > t) break; pr += r.pts * decayW((t - r.ms) / DAY, hl); }
      const dt = new Date(t);
      return { t, pr, label: t === NOW.getTime() ? "Now" : dt.toLocaleDateString("en-GB", { month: "short" }) };
    });
    let peakPR = 0, peakI = 0;
    series.forEach((p, i) => { if (p.pr >= peakPR) { peakPR = p.pr; peakI = i; } });
    const rawTotal = list.reduce((s, r) => s + r.pts, 0);
    const titles = list.filter((r) => r.round === "W").length;
    const finals = list.filter((r) => ROUND_DEPTH[r.round] >= 5).length;
    const semis  = list.filter((r) => ROUND_DEPTH[r.round] >= 4).length;
    let best = list[0];
    list.forEach((r) => {
      if (ROUND_DEPTH[r.round] > ROUND_DEPTH[best.round] ||
        (ROUND_DEPTH[r.round] === ROUND_DEPTH[best.round] && ptsFor(r.tier, "W") > ptsFor(best.tier, "W"))) best = r;
    });
    const log = [...list].reverse().map((r) => ({ ...r }));
    return { key, display, series, currentPR: series[series.length - 1].pr, peakPR, peakI,
      rawTotal, titles, finals, semis, best, log, events: list.length };
  });

  const ranked = [...profiles].sort((a, b) => b.currentPR - a.currentPR);
  ranked.forEach((p, i) => (p.rank = i + 1));
  const byKey = {};
  profiles.forEach((p) => (byKey[p.key] = p));
  return { ranked, byKey, field: profiles.length, tournaments: new Set(data.map((r) => r.tournament)).size };
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
.artp-root{--court:#0A1322;--surface:#111B2E;--surface2:#172339;--line:#26344F;--text:#EAF0F8;--muted:#8090A8;--ball:#5191FF;--clay:#FFFFFF;
  font-family:'Inter',system-ui,sans-serif;color:var(--text);background:radial-gradient(120% 80% at 50% -10%,#15233F 0%,var(--court) 55%);min-height:100%;padding:26px 18px 56px;box-sizing:border-box}
.artp-root *{box-sizing:border-box}
.wrap{max-width:1060px;margin:0 auto}
.disp{font-family:'Saira Condensed',sans-serif;font-weight:700;font-variant-numeric:tabular-nums}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px;flex-wrap:wrap}
.brand{display:flex;align-items:baseline;gap:10px}
.brand .mark{font-family:'Saira Condensed';font-weight:700;font-size:22px;letter-spacing:.05em}
.brand .ball{color:var(--ball)}
.brand .sub{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.seg{display:flex;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:3px}
.seg button{display:flex;align-items:center;gap:6px;background:transparent;border:0;color:var(--muted);font-family:'Inter';font-weight:600;font-size:13px;padding:6px 14px;border-radius:999px;cursor:pointer}
.seg button.on{background:var(--ball);color:#0A1322}
.seg button svg{width:14px;height:14px}
.searchbox{display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:9px 15px}
.searchbox input{background:transparent;border:0;outline:0;color:var(--text);font-size:14px;width:160px;font-family:'Inter'}
.searchbox input::placeholder{color:var(--muted)}
.searchbox svg{color:var(--muted)}
.importbar{background:var(--surface);border:1px solid var(--line);border-radius:12px;margin-bottom:18px;overflow:hidden}
.importhead{display:flex;align-items:center;gap:10px;padding:11px 15px;cursor:pointer;font-size:13px;color:var(--muted)}
.importhead svg.db{color:var(--ball)}
.importhead .chev{margin-left:auto;transition:transform .2s}
.importhead .chev.open{transform:rotate(180deg)}
.importhead b{color:var(--text);font-weight:600}
.importbody{padding:0 15px 15px;display:grid;gap:11px}
.importbody .hint{font-size:12px;color:var(--muted);line-height:1.6}
.importbody .hint code{background:var(--surface2);border:1px solid var(--line);border-radius:5px;padding:1px 6px;color:#C3D2EA;font-size:11.5px}
.importbody textarea{width:100%;height:130px;background:#091020;border:1px solid var(--line);border-radius:9px;color:var(--text);font-family:ui-monospace,monospace;font-size:11px;padding:10px;resize:vertical;line-height:1.5}
.improw{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.btn{background:var(--ball);color:#0A1322;border:0;border-radius:8px;font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.03em;padding:8px 18px;cursor:pointer}
.slider{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted)}
.slider input{accent-color:var(--ball)}
.slider b{color:var(--text);font-family:'Saira Condensed';font-weight:600}
.grid{display:grid;grid-template-columns:1fr 290px;gap:16px;align-items:start}
@media(max-width:860px){.grid{grid-template-columns:1fr}}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px}
.hero{padding:20px 22px;position:relative;overflow:hidden}
.hero:before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--ball),transparent 60%)}
.hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
.idblock{display:flex;align-items:center;gap:14px}
.avatar{width:56px;height:56px;border-radius:13px;background:var(--surface2);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-family:'Saira Condensed';font-weight:700;font-size:27px;color:var(--ball)}
.uname{font-size:30px;line-height:1;margin:0;word-break:break-all}
.modetag{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.metrics{display:flex;gap:22px;text-align:right}
.metric .lbl{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.metric .big{font-size:46px;line-height:.9}
.metric.pr .big{color:var(--ball)}
.metric.raw .big{color:#C3D2EA;font-size:28px;margin-top:13px}
.rankpill{display:inline-flex;align-items:center;gap:5px;margin-top:7px;background:var(--ball);color:#0A1322;font-family:'Saira Condensed';font-weight:700;font-size:14px;padding:3px 10px;border-radius:999px}
.form{display:flex;gap:6px;margin-top:16px;flex-wrap:wrap}
.chip{font-family:'Saira Condensed';font-weight:600;font-size:12px;padding:4px 8px;border-radius:7px;border:1px solid var(--line);color:var(--muted);background:var(--surface2)}
.chip.W{background:var(--ball);color:#0A1322;border-color:var(--ball)}
.chip.F{color:#fff;border-color:rgba(255,255,255,.4)}
.stats{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:16px}
@media(max-width:680px){.stats{grid-template-columns:repeat(3,1fr)}}
.stat{background:var(--surface);padding:13px 11px}
.stat .v{font-family:'Saira Condensed';font-weight:700;font-size:23px;line-height:1}
.stat .v.accent{color:var(--ball)}
.stat .k{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:5px}
.chartcard{padding:16px 16px 6px;margin-top:16px}
.chart-head{display:flex;align-items:center;justify-content:space-between;margin:0 6px 4px}
.chart-head .t{display:flex;align-items:center;gap:8px;font-family:'Saira Condensed';font-weight:600;font-size:15px}
.chart-head .t svg{color:var(--ball);width:16px;height:16px}
.chart-head .sm{color:var(--muted);font-weight:400;font-size:11px;font-family:'Inter'}
.peaktag{font-size:11px;color:var(--muted)}
.peaktag b{color:#fff}
.tip{background:#091020;border:1px solid var(--line);border-radius:9px;padding:7px 10px;font-size:12px}
.tip .pr{color:var(--ball);font-family:'Saira Condensed';font-weight:700;font-size:15px}
.tip .meta{color:var(--muted)}
.tablecard{padding:4px 2px 6px;margin-top:16px}
.tcap{font-family:'Saira Condensed';font-weight:600;font-size:15px;padding:11px 15px 3px}
table.ev{width:100%;border-collapse:collapse;font-size:12.5px}
table.ev th{text-align:left;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;padding:8px 15px;border-bottom:1px solid var(--line)}
table.ev td{padding:10px 15px;border-bottom:1px solid #1b2740}
table.ev tr:last-child td{border-bottom:0}
table.ev .num{text-align:right;font-variant-numeric:tabular-nums}
.tier{font-size:11px;color:var(--muted)}
.res{font-family:'Saira Condensed';font-weight:600}
.res.W{color:var(--ball)} .res.F{color:#fff}
.pts{color:#C3D2EA;font-family:'Saira Condensed';font-weight:600}
.partner{color:var(--muted);font-size:11.5px}
.lb{padding:14px 0 6px}
.lb h3{font-family:'Saira Condensed';font-weight:600;font-size:14px;letter-spacing:.05em;margin:0 0 5px;padding:0 16px;display:flex;justify-content:space-between}
.lb h3 span{color:var(--muted);font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}
.lb .row{display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;border-left:3px solid transparent}
.lb .row:hover{background:var(--surface2)}
.lb .row.active{background:var(--surface2);border-left-color:var(--ball)}
.lb .r{font-family:'Saira Condensed';font-weight:700;color:var(--muted);width:22px;font-size:14px}
.lb .row.active .r{color:var(--ball)}
.lb .nm{flex:1;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb .pp{font-family:'Saira Condensed';font-weight:600;font-size:13.5px;color:var(--ball);font-variant-numeric:tabular-nums}
.empty{padding:46px 24px;text-align:center}
.empty .big{font-family:'Saira Condensed';font-weight:600;font-size:21px;margin-bottom:8px}
.empty p{color:var(--muted);font-size:14px;margin:0 0 14px}
.try{display:inline-flex;gap:8px;flex-wrap:wrap;justify-content:center}
.try button{background:var(--surface2);border:1px solid var(--line);color:var(--text);border-radius:999px;padding:6px 13px;font-size:13px;cursor:pointer}
.try button:hover{border-color:var(--ball);color:var(--ball)}
.fade{animation:fade .3s ease}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.fade{animation:none}}
`;

function PRTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return <div className="tip"><div className="pr">{fmt(d.pr)} PR</div><div className="meta">{d.label}</div></div>;
}

export default function ARTPTracker() {
  const [mode, setMode] = useState("S");
  const [hl, setHl] = useState(360);
  const [query, setQuery] = useState("ilovetennis678");
  const [active, setActive] = useState("ilovetennis678");
  const [showImport, setShowImport] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_DATA.trim());
  const [src, setSrc] = useState(DEFAULT_DATA);

  const rows = useMemo(() => parseRows(src), [src]);
  const model = useMemo(() => buildModel(rows, mode, hl), [rows, mode, hl]);
  const profile = model.byKey[canon(active)] || null;

  const submit = () => {
    const k = canon(query);
    if (model.byKey[k]) { setActive(k); return; }
    const hit = model.ranked.find((p) => p.key.includes(query.trim().toLowerCase()) || p.display.toLowerCase().includes(query.trim().toLowerCase()));
    setActive(hit ? hit.key : "__none__");
  };

  return (
    <div className="artp-root">
      <style>{CSS}</style>
      <div className="wrap">
        <div className="topbar">
          <div className="brand"><span className="mark">ARTP<span className="ball">·</span>TRACKER</span><span className="sub">Power Ranking · S6–S8</span></div>
          <div className="tools">
            <div className="seg">
              <button className={mode === "S" ? "on" : ""} onClick={() => setMode("S")}><User /> Singles</button>
              <button className={mode === "D" ? "on" : ""} onClick={() => setMode("D")}><Users /> Doubles</button>
            </div>
            <div className="searchbox">
              <Search size={16} />
              <input value={query} placeholder="Search player…" onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
          </div>
        </div>

        <div className="importbar">
          <div className="importhead" onClick={() => setShowImport(!showImport)}>
            <Database className="db" size={16} />
            <span><b>{model.tournaments}</b> {mode === "S" ? "singles" : "doubles"} events · <b>{model.field}</b> players · PR decays 100% for 90d then {hl}d half-life</span>
            <ChevronDown className={`chev ${showImport ? "open" : ""}`} size={16} />
          </div>
          {showImport && (
            <div className="importbody">
              <div className="hint">One row per result: <code>mode|date|tournament|tier|player|round|partner</code> — <code>mode</code> S/D · <code>tier</code> Grand Slam/Masters/500/250 · <code>round</code> W F SF QF R16 R32 R64 · partner for doubles. Append new tournaments and Rebuild.</div>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} />
              <div className="improw">
                <button className="btn" onClick={() => setSrc(draft)}>Rebuild PR</button>
                <div className="slider">half-life <b>{hl}d</b><input type="range" min="60" max="365" step="10" value={hl} onChange={(e) => setHl(+e.target.value)} /></div>
              </div>
            </div>
          )}
        </div>

        <div className="grid">
          <div>
            {profile ? (
              <div className="fade" key={profile.key + mode}>
                <div className="card hero">
                  <div className="hero-top">
                    <div className="idblock">
                      <div className="avatar">{profile.display[0].toUpperCase()}</div>
                      <div>
                        <h1 className="disp uname">{profile.display}</h1>
                        <div className="modetag">{mode === "S" ? "Singles" : "Doubles"} · Season 8</div>
                      </div>
                    </div>
                    <div className="metrics">
                      <div className="metric pr"><div className="lbl">Power Ranking</div><div className="disp big">{fmt(profile.currentPR)}</div><div className="rankpill"><Crown size={12} /> #{profile.rank} of {model.field}</div></div>
                      <div className="metric raw"><div className="lbl">career pts · raw</div><div className="disp big">{fmt(profile.rawTotal)}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>no decay</div></div>
                    </div>
                  </div>
                  <div className="form">
                    {profile.log.slice(0, 5).reverse().map((s, i) => (
                      <span key={i} className={`chip ${s.round}`} title={s.tournament}>{s.round}</span>
                    ))}
                  </div>
                </div>

                <div className="stats">
                  <div className="stat"><div className="disp v accent">{fmt(profile.peakPR)}</div><div className="k">Peak PR</div></div>
                  <div className="stat"><div className="disp v">{profile.events}</div><div className="k">Events</div></div>
                  <div className="stat"><div className="disp v">{profile.titles}</div><div className="k">Titles</div></div>
                  <div className="stat"><div className="disp v">{profile.finals}</div><div className="k">Finals</div></div>
                  <div className="stat"><div className="disp v">{profile.semis}</div><div className="k">Semis+</div></div>
                  <div className="stat"><div className="disp v">{ROUND_LABEL[profile.best.round].split(" ")[0]}</div><div className="k">Best · {profile.best.tier}</div></div>
                </div>

                <div className="card chartcard">
                  <div className="chart-head">
                    <div className="t"><TrendingUp /> PR Trajectory <span className="sm">100% for 90d, then {hl}d half-life</span></div>
                    <div className="peaktag">peak <b>{fmt(profile.peakPR)}</b> @ {profile.series[profile.peakI].label}</div>
                  </div>
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <AreaChart data={profile.series} margin={{ top: 12, right: 14, left: -6, bottom: 4 }}>
                        <defs><linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5191FF" stopOpacity={0.30} /><stop offset="100%" stopColor="#5191FF" stopOpacity={0.02} /></linearGradient></defs>
                        <CartesianGrid stroke="#1b2740" vertical={false} />
                        <XAxis dataKey="label" stroke="#5a6a85" tick={{ fontSize: 11, fill: "#8090A8" }} tickLine={false} axisLine={{ stroke: "#26344F" }} />
                        <YAxis stroke="#5a6a85" tick={{ fontSize: 10.5, fill: "#8090A8" }} tickLine={false} axisLine={false} width={44} />
                        <Tooltip content={<PRTip />} cursor={{ stroke: "#33476b" }} />
                        <Area type="monotone" dataKey="pr" stroke="#5191FF" strokeWidth={2.3} fill="url(#pf)" dot={{ r: 2.5, fill: "#5191FF", stroke: "none" }} activeDot={{ r: 4.5, fill: "#5191FF" }} />
                        <ReferenceDot x={profile.series[profile.peakI].label} y={profile.peakPR} r={4.5} fill="#FFFFFF" stroke="#0A1322" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card tablecard">
                  <div className="tcap">Event log · {mode === "S" ? "singles" : "doubles"}</div>
                  <table className="ev">
                    <thead><tr><th>Date</th><th>Tournament</th>{mode === "D" && <th>Partner</th>}<th>Result</th><th className="num">Pts</th></tr></thead>
                    <tbody>
                      {profile.log.map((s, i) => (
                        <tr key={i}>
                          <td>{new Date(s.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                          <td>{s.tournament} <span className="tier">· {s.tier}</span></td>
                          {mode === "D" && <td className="partner">{s.partner || "—"}</td>}
                          <td><span className={`res ${s.round}`}>{ROUND_LABEL[s.round]}</span></td>
                          <td className="num pts">{fmt(s.pts)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card empty fade">
                <div className="disp big">No {mode === "S" ? "singles" : "doubles"} player “{query}”</div>
                <p>Try one of these:</p>
                <div className="try">{model.ranked.slice(0, 5).map((p) => (<button key={p.key} onClick={() => { setQuery(p.display); setActive(p.key); }}>{p.display}</button>))}</div>
              </div>
            )}
          </div>

          <div className="card lb">
            <h3>{mode === "S" ? "Singles" : "Doubles"} PR <span>Top 32</span></h3>
            {model.ranked.slice(0, 32).map((p) => (
              <div key={p.key} className={`row ${p.key === canon(active) ? "active" : ""}`} onClick={() => { setActive(p.key); setQuery(p.display); }}>
                <span className="r">{p.rank}</span><span className="nm">{p.display}</span><span className="pp">{fmt(p.currentPR)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
