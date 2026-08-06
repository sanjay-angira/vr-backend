# Policy Example Payloads

This document provides example JSON payloads for the various policy endpoints.

## About Us
`POST /backend/api/policies/about-us`
```json
{
  "title": "About Spicy Roots",
  "content": "<h1>Our Story</h1><p>Founded in 2024, Spicy Roots brings you the finest organic spices from the heart of India. Our mission is to promote wellness through authentic, traceable, and chemical-free ingredients.</p><h2>Our Values</h2><ul><li>Purity</li><li>Sustainability</li><li>Traceability</li></ul>",
  "isActive": true
}
```

## Privacy Policy
`POST /backend/api/policies/privacy-policy`
```json
{
  "title": "Privacy Policy",
  "content": "<h1>Privacy Matters</h1><p>We are committed to protecting your personal information.</p><h2>Information We Collect</h2><p>We collect your name, email, and shipping address to process your orders.</p><h2>How We Use It</h2><p>Your information is used solely for order processing and newsletter distribution (if opted-in).</p>",
  "isActive": true
}
```

## Terms of Use
`POST /backend/api/policies/term-of-use`
```json
{
  "title": "Website Terms of Use",
  "content": "<h1>General Terms</h1><p>By accessing this website, you agree to be bound by these Terms of Use and all applicable laws and regulations.</p><h2>Use License</h2><p>Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.</p>",
  "isActive": true
}
```

## Delivery and Shipping Policy
`POST /backend/api/policies/delivery-and-shipping`
```json
{
  "title": "Shipping Policy",
  "content": "<h1>Shipping Times</h1><p>Orders are typically processed within 24-48 hours. Shipping takes 3-7 business days depending on your location.</p><h2>Shipping Costs</h2><p>Free shipping on orders over ₹500. A flat fee of ₹50 applies otherwise.</p>",
  "isActive": true
}
```

## Refund Policy
`POST /backend/api/policies/refund-policy`
```json
{
  "title": "Refund and Cancellation Policy",
  "content": "<h1>Cancellations</h1><p>Orders can be cancelled within 2 hours of placement.</p><h2>Refund Process</h2><p>Once we receive the returned item, a refund will be initiated to your original payment method within 5-7 working days.</p>",
  "isActive": true
}
```

## Replace Policy
`POST /backend/api/policies/replace-policy`
```json
{
  "title": "Replacement Policy",
  "content": "<h1>Damaged Items</h1><p>If you receive a damaged product, please contact us within 24 hours of delivery. We will arrange a free replacement.</p>",
  "isActive": true
}
```

## Cancellation and Return Policy
`POST /backend/api/policies/cancellation-and-return`
```json
{
  "title": "Cancellation and Return Guidelines",
  "content": "<h1>Returns Policy</h1><p>Products must be returned in their original packaging with the seal intact.</p>",
  "isActive": true
}
```
