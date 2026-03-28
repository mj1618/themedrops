# Themedrops

Theme sharing site.

# Logs

```bash
{ declare -A s; while sleep 2; do for f in logs/*.log; do [[ ${s[$f]} ]] || { tail -n10 -F "$f" & s[$f]=1; }; done; done; } | grep --line-buffered -E '^\s*[\[{]' | npx @khanacademy/format-claude-stream
```
