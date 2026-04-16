from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "mobile"
ASSETS = MOBILE / "assets"
ANDROID_RES = MOBILE / "android" / "app" / "src" / "main" / "res"

BG = "#0B0B12"
INNER = "#141420"
WHITE = "#F7F4FF"
PURPLE = (139, 92, 255)
BLUE = (40, 167, 255)
ORANGE = (255, 155, 66)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def gradient_color(t: float):
    if t < 0.55:
        local = t / 0.55
        return tuple(lerp(PURPLE[i], BLUE[i], local) for i in range(3))
    local = (t - 0.55) / 0.45
    return tuple(lerp(BLUE[i], ORANGE[i], local) for i in range(3))


def draw_logo(size: int, glow: bool = True):
    img = Image.new("RGBA", (size, size), BG)
    cx = cy = size // 2

    if glow:
        glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_layer)
        gdraw.ellipse(
            (size * 0.11, size * 0.11, size * 0.89, size * 0.89),
            fill=(116, 95, 255, 68),
        )
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=size * 0.07))
        img.alpha_composite(glow_layer)

    bubble_mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(bubble_mask)
    body = (size * 0.16, size * 0.14, size * 0.84, size * 0.82)
    mdraw.rounded_rectangle(body, radius=size * 0.24, fill=255)
    tail = [
        (size * 0.62, size * 0.76),
        (size * 0.80, size * 0.78),
        (size * 0.67, size * 0.92),
    ]
    mdraw.polygon(tail, fill=255)

    gradient = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gpix = gradient.load()
    for y in range(size):
        for x in range(size):
            t = min(1.0, max(0.0, (x * 0.7 + y * 0.3) / (size - 1)))
            r, g, b = gradient_color(t)
            gpix[x, y] = (r, g, b, 255)
    gradient.putalpha(bubble_mask)
    img.alpha_composite(gradient)

    border = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(border)
    bdraw.rounded_rectangle(body, radius=size * 0.24, outline=(255, 255, 255, 72), width=max(2, size // 64))
    bdraw.line([tail[0], tail[1], tail[2], tail[0]], fill=(255, 198, 140, 110), width=max(2, size // 80))
    img.alpha_composite(border)

    draw = ImageDraw.Draw(img)
    inner = (size * 0.28, size * 0.26, size * 0.72, size * 0.66)
    draw.rounded_rectangle(inner, radius=size * 0.17, fill=INNER)

    eye_r = size * 0.035
    left_eye = (size * 0.41 - eye_r, size * 0.42 - eye_r, size * 0.41 + eye_r, size * 0.42 + eye_r)
    right_eye = (size * 0.59 - eye_r, size * 0.42 - eye_r, size * 0.59 + eye_r, size * 0.42 + eye_r)
    draw.ellipse(left_eye, fill=WHITE)
    draw.ellipse(right_eye, fill=WHITE)

    smile_box = (size * 0.38, size * 0.40, size * 0.62, size * 0.58)
    draw.arc(smile_box, start=20, end=160, fill=WHITE, width=max(3, size // 42))
    return img


def centered_logo_canvas(size: int, logo_scale: float):
    canvas = Image.new("RGBA", (size, size), BG)
    logo = draw_logo(int(size * logo_scale))
    offset = ((size - logo.width) // 2, (size - logo.height) // 2)
    canvas.alpha_composite(logo, offset)
    return canvas


def export_assets():
    centered_logo_canvas(1024, 0.74).save(ASSETS / "icon.png")
    centered_logo_canvas(1024, 0.66).save(ASSETS / "adaptive-icon.png")

    splash = Image.new("RGBA", (1242, 2688), BG)
    logo = draw_logo(540)
    splash.alpha_composite(logo, ((splash.width - logo.width) // 2, int(splash.height * 0.28)))
    splash.save(ASSETS / "splash.png")

    splash_sizes = {
        "drawable-mdpi": 140,
        "drawable-hdpi": 210,
        "drawable-xhdpi": 280,
        "drawable-xxhdpi": 420,
        "drawable-xxxhdpi": 560,
    }
    for folder, size in splash_sizes.items():
        out = ANDROID_RES / folder / "splashscreen_logo.png"
        out.parent.mkdir(parents=True, exist_ok=True)
        draw_logo(size).save(out)

    icon_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in icon_sizes.items():
        fg = centered_logo_canvas(size, 0.76)
        ic = centered_logo_canvas(size, 0.92)
        round_ic = centered_logo_canvas(size, 0.92)
        fg.save(ANDROID_RES / folder / "ic_launcher_foreground.webp", format="WEBP")
        ic.save(ANDROID_RES / folder / "ic_launcher.webp", format="WEBP")
        round_ic.save(ANDROID_RES / folder / "ic_launcher_round.webp", format="WEBP")


if __name__ == "__main__":
    export_assets()
