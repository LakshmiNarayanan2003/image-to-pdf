"""Optional regeneration: pillow-heif==1.3.0, Pillow==12.3.0. Synthetic image only.
Committed HEVC fixture permits browser tests without Python or external downloads.
"""
from PIL import Image
import pillow_heif
pillow_heif.register_heif_opener()
image = Image.open('tests/fixtures/quadrants.png').convert('RGB')
image.save('tests/fixtures/graphic.heic', format='HEIF', quality=95, enc_params={'lossless': '0'})
