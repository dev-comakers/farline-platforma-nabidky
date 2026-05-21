PŘÍLOHA Č. 1

SPECIFIKACE DÍLA

(ke Smlouvě o dílo uzavřené mezi Smluvními stranami)

1. Předmět Díla

Předmětem Díla je návrh, vývoj, implementace a spuštění webové platformy „Farline Nabídky"

pro společnost F.A.R. LINE, spol. s r.o., sestávajícího z následujících komponent:

• Katalog produktů s fotografiemi, technickými listy a vyhledáváním

• Konstruktor cenových nabídek s výběrem z katalogu a live kalkulací

• Stavové řízení nabídek i jednotlivých položek

• Sdílení nabídky veřejným odkazem pro architekty

• Pohled architekta s komentářovým systémem

• Detailní karta produktu s technickými parametry a přílohami

• Export nabídek do PDF a Excel

• Dashboard s přehledem nabídek a aktivity

• E-mailové notifikace o nových komentářích

• Prvotní naplnění katalogu daty z ceníků dodavatelů

2. Popis komponent Díla

2.1 Katalog produktů

Centrální databáze produktů prémiové sanitární techniky a interiérových prvků:

• Zobrazení produktů formou kartiček s fotografií, kódem, názvem, značkou, dekorem/barvou

a cenou

• Fulltextové vyhledávání podle kódu a názvu

• Filtry: značka, dekor/barva, typ produktu

• Ruční přidání produktu s formulářem včetně textového pole pro parametry

• Upload fotografie k produktu (drag & drop, JPG/PNG/WebP)

• Upload přílohy — technický list v PDF (1 soubor na produkt)

• Import produktů z CSV/Excel se šablonou očekávané struktury

• Editace a mazání produktů

2.2 Detailní karta produktu

Při kliknutí na produkt (v katalogu i v nabídce pro architekta) se otevře rozšířená karta:

• Zvětšená fotografie produktu

• Kód, název, značka, dekor/barva, cena

• Textové pole „Parametry" (rozměry, objem, hmotnost, povrch aj.)

• Odkaz ke stažení technického listu (PDF), pokud je nahrán

• Architekt si může technický list stáhnout přímo z nabídky

2.3 Konstruktor cenových nabídek

Hlavní pracovní obrazovka pro tvorbu a správu nabídek:

• Editovatelná hlavička: název akce (projekt), jméno architekta/investora

• Přidávání produktů z katalogu přes boční vyhledávací panel

• Tabulka položek: miniatura, kód, název, dekor, značka, počet, sleva %, cena po slevě

• Stav jednotlivých položek: checkboxy „Potvrzeno" a „Objednáno" u každé pozice

• Automatický přepočet celkové ceny při každé změně

• Sumarizace: celkem před slevou, celková sleva, celkem po slevě

• Interní poznámka (vidí pouze Objednatel)

• Možnost skrytí vybraných sloupců v nabídce při exportu a sdílení (např. skrytí kódu

produktů)

2.4 Stavové řízení nabídek

Celková nabídka: rozpracovaná → odeslaná → okomentovaná → potvrzená. Jednotlivé položky:

nepotvrzená → potvrzená → objednáno. Stavy položek jsou nezávislé na celkovém stavu

nabídky. Architekt v pohledu přes sdílený odkaz vidí aktuální stavy položek.

2.5 Sdílení nabídky

• Tlačítko „Sdílet" vygeneruje unikátní veřejný odkaz (UUID)

• Odkaz lze zkopírovat do schránky jedním kliknutím

• Po sdílení se stav nabídky automaticky změní na „odeslaná"

2.6 Pohled architekta (veřejná stránka)

Stránka přístupná přes sdílený odkaz bez přihlášení. Přístup pro architekty bude umístěn na

webových stránkách [farline.cz](http://farline.cz) (např. [farline.cz/nabidka/{id}](http://farline.cz/nabidka/{id})):

• Branding Farline Living (logo, profesionální layout)

• Kompletní tabulka položek s fotografiemi a cenami (read-only)

• Stavy položek (potvrzeno / objednáno) viditelné pro architekta

• Možnost kliknout na produkt a zobrazit detailní kartu s technickým listem

• Sumarizace, tlačítka „Stáhnout PDF" a „Stáhnout Excel"

• Formulář pro komentáře: jméno, e-mail, text komentáře

2.7 Export PDF

Generování PDF ve stylu stávajících nabídek Farline Living: hlavička s logem, tabulka s

fotografiemi produktů, kódy, cenami, slevami a sumarizací. Možnost skrytí vybraných sloupců

dle nastavení nabídky (např. skrytí kódu produktů). Lokalizace: český jazyk, formát cen CZK.

2.8 Export Excel

Export nabídky do .xlsx se všemi daty, formátováním hlavičky, čísly a sumarizací. Respektuje

nastavení viditelnosti sloupců dle nabídky.

2.9 Dashboard

• Metriky: celkem nabídek, rozpracované, odeslané, nové komentáře

• Poslední aktivita: timeline událostí

• Rychlé akce: „Nová nabídka", „Otevřít katalog"

2.10 E-mailové notifikace

Při novém komentáři od architekta systém odešle e-mailovou notifikaci Objednateli s názvem

nabídky, jménem a e-mailem architekta a textem komentáře.

2.11 Prvotní naplnění katalogu

Zhotovitel provede jednorázové nahrání produktových dat z ceníků dodaných Objednatelem:

• Minimálně 5 ceníků hlavních dodavatelů (Cielo, GEDA, CoalBrook, Radomonte, Lefroy &

Brooks a další)

• Konverze Excel/CSV ceníků do struktury katalogu

• Přiřazení kategorií, značek a dekorů

• Objednatel dodá ceníky nejpozději do 3 pracovních dní od zahájení prací

3. Harmonogram realizace a předání Díla

• Zahájení plnění: po uhrazení zálohy a dodání přístupů dle čl. 6 smlouvy

• Doba realizace: 10 pracovních dní

• Spuštění do produkce: po dokončení implementace a úspěšném otestování

3.1 Postup předání Díla

Předání Díla probíhá formou společné schůzky obou Smluvních stran. Zhotovitel na základě

odsouhlaseného seznamu funkčností předvede funkčnost jednotlivých částí systému.

Objednatel každou funkčnost buď akceptuje, nebo poskytne konkrétní komentáře k doplnění či

opravě. Po odsouhlasení veškeré funkčnosti a podpisu předávacího protokolu je Objednatel

povinen uhradit finální fakturu (50 % ceny Díla).

3.2 Záruční lhůta

Po uhrazení finální faktury a předání Díla poskytuje Zhotovitel Objednateli záruční lhůtu v délce

14 kalendářních dnů. Během této lhůty Zhotovitel bezplatně odstraňuje chyby vzniklé na straně

jeho implementace. Záruční lhůta se nevztahuje na změny požadavků, rozšíření funkčnosti ani

na výpadky způsobené třetími stranami (Vercel, Resend, poskytovateli e-mailových služeb).
