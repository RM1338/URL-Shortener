import qrcode
from typing import List

def generate_qr_matrix(url: str, size: int = 25) -> List[List[int]]:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=1,
        border=1,
    )

    qr.add_data(url)
    qr.make(fit=True)

    qr_matrix = qr.get_matrix()

    matrix = [[1 if cell else 0 for cell in row] for row in qr_matrix]

    return matrix

def get_qr_dimensions(url: str) -> dict:
    matrix = generate_qr_matrix(url)
    return {
        'width': len(matrix[0]) if matrix else 0,
        'height': len(matrix) if matrix else 0,
        'total_blocks': sum(sum(row) for row in matrix)
    }