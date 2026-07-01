import sys

file_path = 'app/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('<span>Kapruka shopping desk</span>', '<span>{uiText("Kapruka shopping desk", preferredLanguage)}</span>'),
    ('<h1>{temporaryChat ? "Temporary chat" : chatTitle(messages)}</h1>', '<h1>{temporaryChat ? uiText("Temporary chat", preferredLanguage) : chatTitle(messages)}</h1>'),
    ('placeholder="Search Kapruka or chat..."', 'placeholder={uiText("Search Kapruka or chat...", preferredLanguage)}'),
    ('<h2>Your cart</h2>', '<h2>{uiText("Your cart", preferredLanguage)}</h2>'),
    ('<h2>Product</h2>', '<h2>{uiText("Product", preferredLanguage)}</h2>'),
    ('<h3>Your cart is empty</h3>', '<h3>{uiText("Your cart is empty", preferredLanguage)}</h3>'),
    ('Start shopping to build a gift bundle.', '{uiText("Start shopping to build a gift bundle.", preferredLanguage)}'),
    ('>Proceed to Secure Kapruka Checkout<', '>{uiText("Proceed to Secure Kapruka Checkout", preferredLanguage)}<'),
    ('>Your gift bundle<', '>{uiText("Your gift bundle", preferredLanguage)}<'),
    ('>Subtotal<', '>{uiText("Subtotal", preferredLanguage)}<'),
    ('>Delivery<', '>{uiText("Delivery", preferredLanguage)}<'),
    ('>Total<', '>{uiText("Total", preferredLanguage)}<'),
    ('<h2>Order Details</h2>', '<h2>{uiText("Order Details", preferredLanguage)}</h2>'),
    ('<h2>Checkout</h2>', '<h2>{uiText("Checkout", preferredLanguage)}</h2>'),
    ('>No product selected<', '>{uiText("No product selected", preferredLanguage)}<'),
    ('>Pick something from chat or search to inspect it here.<', '>{uiText("Pick something from chat or search to inspect it here.", preferredLanguage)}<'),
    ('>Checkout details are not started yet.<', '>{uiText("Checkout details are not started yet.", preferredLanguage)}<'),
    ('>Checkout details are not complete. Continue collecting them.<', '>{uiText("Checkout details are not complete. Continue collecting them.", preferredLanguage)}<'),
    ('>Order creation failed.<', '>{uiText("Order creation failed.", preferredLanguage)}<'),
    ('>Try again<', '>{uiText("Try again", preferredLanguage)}<'),
    ('>Start fresh<', '>{uiText("Start fresh", preferredLanguage)}<'),
    ('>Yes, continue<', '>{uiText("Yes, continue", preferredLanguage)}<')
]

count = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        print(f'Not found: {old}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Replaced {count} string occurrences.')
