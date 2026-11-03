#!/bin/bash
# Weißer Rahmen + 3 Textzeilen (Kamera/Objektiv, Belichtung, Fuji-Rezept)
# Aufruf: ./rahmen_fuji.sh [Dateien...]  (ohne Argumente: alle JPGs im Ordner)
# Ausgabe: Unterordner "mit_rahmen"; Originale bleiben unverändert
# Voraussetzungen (macOS): brew install imagemagick exiftool
# Hinweis: Ursprüngliche CLI-Variante, nur noch Referenz. Maßstab ist prototype/rahmen.html.

shopt -s nullglob nocaseglob
mkdir -p mit_rahmen

FB="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FR="/System/Library/Fonts/Supplemental/Arial.ttf"
[ -f "$FB" ] || FB="/System/Library/Fonts/Helvetica.ttc"
[ -f "$FR" ] || FR="/System/Library/Fonts/Helvetica.ttc"

fit() { # font pointsize text maxwidth
  local w
  w=$(magick -font "$1" -pointsize "$2" label:"$3" -format %w info:)
  if [ "$w" -gt "$4" ]; then echo $(( $2 * $4 / w )); else echo "$2"; fi
}

# Wert ohne Klammerzusatz anhängen, außer er ist leer/neutral
add() { # label wert
  local v
  v=$(echo "$2" | sed -E 's/ *\(.*\)//')
  case "$v" in
    ""|"-"|"0"|"+0"|"Normal"|"Standard"|"Off"|"Film Simulation"|"n/a") ;;
    *) PARTS+=("$1$v") ;;
  esac
}

if [ $# -gt 0 ]; then FILES=("$@"); else FILES=(*.jpg); fi

for f in "${FILES[@]}"; do
  out="mit_rahmen/$(basename "$f")"
  read -r W H <<< "$(magick "$f" -auto-orient -format '%w %h' info:)"
  L=$(( W > H ? W : H ))
  B=$(( L * 3 / 100 ))
  E=$(( L * 8 / 100 ))
  MAXW=$(( (W + 2*B) * 92 / 100 ))

  IFS='|' read -r FL FN ET ISO <<< "$(exiftool -n -f -p '$FocalLength|$FNumber|$ExposureTime|$ISO' "$f")"

  IFS='|' read -r MAKE MODEL LENS PROG FILM SAT DRD DRS ADR WB WBFT CCE CCB HT SHT SHP GR CLA <<< "$(exiftool -f -p '$Make|$Model|$LensModel|$ExposureProgram|$FujiFilm:FilmMode|$FujiFilm:Saturation|$FujiFilm:DevelopmentDynamicRange|$FujiFilm:DynamicRangeSetting|$FujiFilm:AutoDynamicRange|$FujiFilm:WhiteBalance|$FujiFilm:WhiteBalanceFineTune|$FujiFilm:ColorChromeEffect|$FujiFilm:ColorChromeFXBlue|$FujiFilm:HighlightTone|$FujiFilm:ShadowTone|$FujiFilm:Sharpness|$FujiFilm:GrainEffectRoughness|$FujiFilm:Clarity' "$f")"

  L1="$MAKE $MODEL"
  [ "$LENS" != "-" ] && L1="$L1  ·  $LENS"

  L2=$(awk -v fl="$FL" -v fn="$FN" -v et="$ET" -v iso="$ISO" -v pr="$PROG" 'BEGIN{
    if (et>0 && et<1) ts=sprintf("1/%d s", int(1/et+0.5)); else ts=sprintf("%g s", et)
    fs=sprintf("%.1f", fn); sub(/\.0$/,"",fs)
    out=sprintf("%g mm  ·  f/%s  ·  %s  ·  ISO %s", fl, fs, ts, iso)
    if (pr!="" && pr!="-") out=out "  ·  " pr
    print out }')

  PARTS=()
  # Film-Simulation: je nach Kamera in FilmMode oder (z. B. Acros) in Saturation
  SATFILM=""; SATCOLOR=""
  case "$SAT" in
    *Acros*|*B\&W*|*Sepia*|*Monochrome*) SATFILM="$SAT" ;;
    *) SATCOLOR="$SAT" ;;
  esac
  add "" "$FILM"
  add "" "$SATFILM"
  if [ "$DRD" != "-" ]; then PARTS+=("DR$DRD")
  elif [ "$DRS" = "Auto" ]; then PARTS+=("DR Auto")
  elif [ "$DRS" != "-" ]; then PARTS+=("DR$DRS"); fi
  FT=$(echo "$WBFT" | sed -E 's/Red ([+-]?[0-9]+), Blue ([+-]?[0-9]+)/R\1 B\2/')
  if [ "$WB" != "-" ]; then
    case "$FT" in ""|"-"|"R0 B0"|"R+0 B+0") PARTS+=("WB $WB") ;; *) PARTS+=("WB $WB $FT") ;; esac
  fi
  add "Color Chrome " "$CCE"
  add "FX Blue " "$CCB"
  add "Highlight " "$HT"
  add "Shadow " "$SHT"
  add "Sharp " "$SHP"
  add "Color " "$SATCOLOR"
  add "Grain " "$GR"
  add "Clarity " "$CLA"

  L3=""
  for p in "${PARTS[@]}"; do
    if [ -z "$L3" ]; then L3="$p"; else L3="$L3  ·  $p"; fi
  done

  P1=$(fit "$FB" $(( L * 155 / 10000 )) "$L1" $MAXW)
  P2=$(fit "$FR" $(( L * 140 / 10000 )) "$L2" $MAXW)
  P3=$(fit "$FR" $(( L * 110 / 10000 )) "$L3" $MAXW)
  Y1=$(( L * 70 / 1000 ))
  Y2=$(( L * 37 / 1000 ))
  Y3=$(( L * 13 / 1000 ))

  ARGS=(-auto-orient -bordercolor white -border ${B}x${B}
        -background white -gravity south -splice 0x${E}
        -fill '#111111' -font "$FB" -pointsize $P1 -annotate +0+$Y1 "$L1"
        -fill '#333333' -font "$FR" -pointsize $P2 -annotate +0+$Y2 "$L2")
  if [ -n "$L3" ]; then
    ARGS+=(-fill '#555555' -pointsize $P3 -annotate +0+$Y3 "$L3")
  fi

  magick "$f" "${ARGS[@]}" -quality 92 "$out"
  echo "OK: $(basename "$f")"
  echo "    $L1"; echo "    $L2"; echo "    $L3"
done
