# Airline Logos Directory

This directory is for storing local airline logo images.

## How It Works

The application uses a **CDN-first approach** with local fallback:

1. **Primary Source**: Kiwi.com CDN (`https://images.kiwi.com/airlines/64/{IATA_CODE}.png`)
2. **Fallback**: Local images in this directory (if CDN fails)
3. **Ultimate Fallback**: Font Awesome plane icon

## Adding Local Logos

To add local airline logos:

1. Download airline logo (PNG format, transparent background recommended)
2. Save as `{iata_code}.png` (lowercase, e.g., `sq.png` for Singapore Airlines)
3. Recommended size: 64x64 or 128x128 pixels
4. Update `/data/airlines.json` if needed

## Supported Logo Sources

### Free CDN Sources:
- **Kiwi.com**: `https://images.kiwi.com/airlines/64/{IATA}.png`
- **Aviation Edge**: `https://aviation-edge.com/wp-content/uploads/2022/01/{IATA}.png`
- **AirLabs**: `https://airlabs.co/img/airline/s/{IATA}.png`

### Example Airlines:
- SQ = Singapore Airlines
- EK = Emirates
- QR = Qatar Airways
- BA = British Airways
- AA = American Airlines

## Configuration

The airline data is managed in `/data/airlines.json` with the following structure:

```json
{
  "name": "Singapore Airlines",
  "iata": "SQ",
  "icao": "SIA",
  "logo": "/img/airlines/sq.png",
  "logo_cdn": "https://images.kiwi.com/airlines/64/SQ.png"
}
```

## Notes

- IATA codes are 2-letter codes (e.g., SQ, EK, BA)
- Logos should be square or have 1:1 aspect ratio
- PNG format with transparent background works best
- The app automatically falls back to icon if logo fails to load
