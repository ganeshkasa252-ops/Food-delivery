const express = require('express');
const router = express.Router();

const menuItems = [
  { id: 'pizza-veggie', name: 'Veg Supreme Pizza', category: 'Pizza', price: 329, image: 'https://i0.wp.com/www.thursdaynightpizza.com/wp-content/uploads/2022/06/veggie-pizza-side-view-out-of-oven.png?resize=720%2C480&ssl=1', description: 'Bell peppers, olives, onions, mushrooms and paneer.' },
  { id: 'pizza-margherita', name: 'Classic Margherita', category: 'Pizza', price: 299, image: 'https://mixthatdrink.com/wp-content/uploads/2023/03/classic-margarita-cocktail-735x1105.jpg', description: 'Fresh tomato sauce, melted mozzarella, and basil leaves.' },
  { id: 'pizza-pepperoni', name: 'Pepperoni Pizza', category: 'Pizza', price: 349, image: 'https://tse4.mm.bing.net/th/id/OIP._Tuj6ElUF8jhhcSg41_V_QHaE8?rs=1&pid=ImgDetMain&o=7&rm=3', description: 'Crispy pepperoni with extra cheese and tomato base.' },
  { id: 'burger-chicken', name: 'Spicy Chicken Burger', category: 'Burger', price: 269, image: 'https://thumbs.dreamstime.com/z/spicy-chicken-burger-crispy-chicken-patty-spicy-mayo-lettuce-tomato-pickles-toasted-sesame-bun-spicy-chicken-347846145.jpg?w=768', description: 'Juicy grilled chicken with spicy sauce and crispy lettuce.' },
  { id: 'burger-veggie', name: 'Veggie Delight Burger', category: 'Burger', price: 229, image: 'https://as2.ftcdn.net/v2/jpg/08/83/27/49/1000_F_883274925_ROHJQNnnuAds3vdlMMJ60BNanvJkTuds.jpg', description: 'Mixed vegetable patty with fresh toppings and special sauce.' },
  { id: 'burger-bbq', name: 'BBQ Paneer Burger', category: 'Burger', price: 249, image: 'https://thumbs.dreamstime.com/z/spicy-chicken-burger-crispy-chicken-patty-spicy-mayo-lettuce-tomato-pickles-toasted-sesame-bun-spicy-chicken-347846145.jpg?w=768', description: 'Smoky BBQ paneer patty with lettuce, tomato and mayo.' },
  { id: 'biryani-chicken', name: 'Hyderabadi Chicken Biryani', category: 'Biryani', price: 339, image: 'https://www.thedeliciouscrescent.com/wp-content/uploads/2019/04/Chicken-Biryani-Square.jpg', description: 'Aromatic saffron rice cooked with tender chicken pieces.' },
  { id: 'biryani-veg', name: 'Vegetable Dum Biryani', category: 'Biryani', price: 289, image: 'https://tse3.mm.bing.net/th/id/OIP.5IpU3LLLQr8XT8l5HZ_MswHaFO?rs=1&pid=ImgDetMain&o=7&rm=3', description: 'Fragrant basmati rice with mixed vegetables and spices.' },
  { id: 'biryani-mutton', name: 'Mutton Biryani', category: 'Biryani', price: 399, image: 'https://d1mxd7n691o8sz.cloudfront.net/static/recipe/recipe/2023-03/Mutton-Biryani-Recipe-aa610f14761f45daaf16cc28861e7227_thumbnail_167947671.jpg', description: 'Premium mutton slow-cooked with basmati rice and aromatics.' },
  { id: 'tiffin-idli', name: 'Idli Sambar Combo', category: 'Tiffins', price: 149, image: 'https://www.nehascookbook.com/wp-content/uploads/2022/09/Instant-idli-sambar-WS-1.jpg', description: 'Soft steamed idlis served with hot sambhar and coconut chutney.' },
  { id: 'tiffin-dosa', name: 'Masala Dosa Tiffin', category: 'Tiffins', price: 179, image: 'https://i.ytimg.com/vi/81MOXdJexbU/maxresdefault.jpg', description: 'Crispy golden dosa stuffed with spiced potato and onion.' },
  { id: 'tiffin-uttapam', name: 'Vegetable Uttapam', category: 'Tiffins', price: 169, image: 'https://th.bing.com/th/id/OIP.Mp_LJb-D_zROz2AKn3oEMgHaE8?o=7&rs=1&pid=ImgDetMain', description: 'Thick rice pancake topped with fresh vegetables and chutney.' },
  { id: 'dessert-gulab', name: 'Gulab Jamun', category: 'Desserts', price: 129, image: 'https://as2.ftcdn.net/v2/jpg/08/94/76/25/1000_F_894762571_KXz2mTpbcjHRGMg48iiU4CnI9v7La4EN.jpg', description: 'Soft syrup-soaked dumplings with cardamom and rose petals.' },
  { id: 'dessert-sundae', name: 'Chocolate Sundae', category: 'Desserts', price: 159, image: 'https://cdn.grofers.com/assets/search/usecase/banner/chocolate_sundae_01.png', description: 'Vanilla ice cream with chocolate sauce, nuts and cherry.' },
  { id: 'dessert-kheer', name: 'Rice Kheer', category: 'Desserts', price: 119, image: 'https://i1.wp.com/www.honeywhatscooking.com/wp-content/uploads/2020/10/Rice-Kheer-Indian-Rice-Pudding42.jpg?w=1536&ssl=1', description: 'Creamy rice pudding flavored with cardamom and dry fruits.' },
  { id: 'wrap-paneer', name: 'Paneer Wrap', category: 'Meals', price: 189, image: 'https://www.shanazrafiq.com/wp-content/uploads/2016/10/2-DSC_0214.jpg', description: 'Grilled paneer with fresh salad wrapped in multigrain bread.' },
  { id: 'wrap-chicken', name: 'Chicken Wrap', category: 'Meals', price: 209, image: 'https://i.pinimg.com/originals/c5/c2/0e/c5c20ecbf74ef43df34c3ab6a9fd6c4e.png', description: 'Juicy grilled chicken with lettuce and sauce in bread wrap.' },
  { id: 'naan-butter', name: 'Butter Naan', category: 'Sides', price: 79, image: 'https://th.bing.com/th/id/OIP.CPLhAVF8Ze3ktj9qWEogGgHaHa?o=7&rs=1&pid=ImgDetMain', description: 'Soft Indian bread with melted butter.' },
  { id: 'naan-garlic', name: 'Garlic Naan', category: 'Sides', price: 89, image: 'https://tse2.mm.bing.net/th/id/OIP.q0R9IhYbPaz2pTP7sqPEgwHaHa?rs=1&pid=ImgDetMain', description: 'Crispy naan with fresh garlic and herbs.' },
  { id: 'beverage-masala', name: 'Masala Chai', category: 'Beverages', price: 69, image: 'https://i.pinimg.com/originals/bc/36/cd/bc36cd86b9bf9b58f7f8f6d89fb0400f.jpg', description: 'Spicy and warming Indian tea with ginger and cardamom.' },
  { id: 'beverage-lassi', name: 'Sweet Lassi', category: 'Beverages', price: 89, image: 'https://www.whiskaffair.com/wp-content/uploads/2021/07/Kesar-Pista-Lassi-2-1-1200x1800.jpg', description: 'Cool yogurt drink with cardamom and rose flavor.' }
];

router.get('/', (req, res) => {
  res.json({ success: true, menu: menuItems });
});

module.exports = router;
