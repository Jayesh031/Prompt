import cv2
import numpy as np

def process_assay_image(image_bytes: bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    B = img[:, :, 0].astype(np.int32)
    G = img[:, :, 1].astype(np.int32)
    R = img[:, :, 2].astype(np.int32)
    
    mask = (R > 127) & (R > G + 25) & (R > B + 25)
    mask = mask.astype(np.uint8) * 255
    
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    circle_contours = []
    rect_contours = []
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 50:
            continue
            
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue
            
        circularity = (4 * np.pi * area) / (perimeter ** 2)
        
        if circularity > 0.85:
            circle_contours.append(cnt)
        else:
            rect_contours.append(cnt)
            
    # --- NEW VALIDATION LOGIC ---
    # If the algorithm didn't find both required zones, reject the image!
    if not circle_contours or not rect_contours:
        raise ValueError("INVALID_ASSAY_IMAGE")
        
    # Process HCT Circle(s)
    c_mask = np.zeros_like(mask)
    cv2.drawContours(c_mask, circle_contours, -1, 255, -1)
    mean_red_circle = cv2.mean(R.astype(np.float32), mask=c_mask)[0]
        
    # Process Largest PT Rectangle
    largest_rect = max(rect_contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_rect)
    length_bbox = float(max(w, h))
    
    r_mask = np.zeros_like(mask)
    cv2.drawContours(r_mask, [largest_rect], -1, 255, -1)
    mean_red_rect = cv2.mean(R.astype(np.float32), mask=r_mask)[0]
        
    return mean_red_circle, mean_red_rect, length_bbox