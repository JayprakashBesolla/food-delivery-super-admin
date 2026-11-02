package com.swiggy.foodapp.config;

import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private DishVariantRepository dishVariantRepository;

    @Autowired
    private DishAddonRepository dishAddonRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OperationalTaskRepository operationalTaskRepository;

    @Override
    public void run(String... args) {
        logger.info("Checking Swiggy Multi-Sector platform seed data...");

        // 1. Seed Users if not present
        if (userRepository.count() == 0) {
            logger.info("Seeding default users (SuperAdmin, Customer, RestaurantPartner, Rider)...");
            User admin = new User("Platform Admin", "admin@swiggy.com", "9999900000", passwordEncoder.encode("Password123!"), Role.SUPER_ADMIN);
            User customer = new User("Rahul Sharma", "customer@swiggy.com", "9876543210", passwordEncoder.encode("Password123!"), Role.CUSTOMER);
            User partner = new User("Royal Biryani Partner", "partner@biryani.com", "9123456780", passwordEncoder.encode("Password123!"), Role.RESTAURANT_PARTNER);
            User rider = new User("Suresh Rider", "rider@swiggy.com", "9876543299", passwordEncoder.encode("Password123!"), Role.DELIVERY_PARTNER);
            userRepository.saveAll(List.of(admin, customer, partner, rider));
        }

        // 2. Seed Food Delivery Restaurants if none exist
        if (restaurantRepository.countByBusinessSector(BusinessSector.FOOD) == 0) {
            seedFoodRestaurants();
        }

        // 3. Seed Instamart (Grocery) Stores if none exist
        if (restaurantRepository.countByBusinessSector(BusinessSector.GROCERY) == 0) {
            seedInstamartGrocery();
        }

        // 4. Seed Pharmacy Stores if none exist
        if (restaurantRepository.countByBusinessSector(BusinessSector.PHARMACY) == 0) {
            seedPharmacy();
        }

        // 5. Seed Meat & Seafood Stores if none exist
        if (restaurantRepository.countByBusinessSector(BusinessSector.MEAT_FISH) == 0) {
            seedMeatAndSeafood();
        }

        // 6. Seed Platform Coupons if none exist
        if (couponRepository.count() == 0) {
            seedCoupons();
        }

        // 7. Seed Super Admin Mock Data (Transactions, Settlements, Tickets, Audit Logs)
        if (paymentTransactionRepository.count() == 0) {
            seedSuperAdminData();
        }

        // Ensure admin has full permissions & global scope
        userRepository.findByEmail("admin@swiggy.com").ifPresent(admin -> {
            if (admin.getPermissions() == null || admin.getPermissions().isEmpty()) {
                admin.setPermissions(Set.of(AdminPermission.ALL_PERMISSIONS));
                admin.setScopeType(PermissionScope.GLOBAL);
                admin.setScopeValue("ALL");
                userRepository.save(admin);
            }
        });

        // 8. Seed Enterprise Departmental Staff
        if (userRepository.findByEmail("finance.officer@swiggy.com").isEmpty()) {
            seedEnterpriseStaff();
        }

        // 9. Seed Operational Work Queues
        if (operationalTaskRepository.count() == 0) {
            seedOperationalTasks();
        }

        logger.info("Swiggy Multi-Sector platform seed check complete! All business sectors active.");
    }

    private void seedFoodRestaurants() {
        logger.info("Seeding Food Delivery restaurants...");

        // Restaurant 1: Royal Biryani House
        Restaurant r1 = new Restaurant();
        r1.setName("Royal Biryani House");
        r1.setSlug("royal-biryani-house-madhapur");
        r1.setBusinessSector(BusinessSector.FOOD);
        r1.setSectorDisplayName("Biryani & Mughlai Specialist");
        r1.setDescription("Authentic Dum Biryani, royal spices, slow-cooked to perfection in handis.");
        r1.setCuisines("Biryani, Mughlai, Kebabs, North Indian");
        r1.setLogoUrl("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200");
        r1.setBannerUrl("https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1000");
        r1.setArea("Madhapur");
        r1.setCity("Hyderabad");
        r1.setAddress("Plot 42, Hitech City Main Road, Madhapur");
        r1.setPincode("500081");
        r1.setPhone("040-23456789");
        r1.setEmail("contact@royalbiryani.in");
        r1.setAvgRating(4.4);
        r1.setTotalRatings(380);
        r1.setDeliveryTimeEstimate("25-35 mins");
        r1.setDistanceKm(2.4);
        r1.setCostForTwo(BigDecimal.valueOf(450.0));
        r1.setDeliveryFee(BigDecimal.valueOf(40.0));
        r1.setPackagingFee(BigDecimal.valueOf(15.0));
        r1.setTaxPercentage(BigDecimal.valueOf(5.0));
        r1.setFreeDeliveryThreshold(BigDecimal.valueOf(500.0));
        r1.setPureVeg(false);
        r1.setOpen(true);
        r1.setStatus(RestaurantStatus.ACTIVE);
        r1.setFssaiNumber("13621014000123");
        r1.setGstin("36AAACR1234F1Z5");
        r1 = restaurantRepository.save(r1);

        Category c11 = categoryRepository.save(new Category(r1, "Handi Biryanis", 1));
        Category c12 = categoryRepository.save(new Category(r1, "Royal Kebabs & Starters", 2));

        Dish d1 = new Dish();
        d1.setRestaurant(r1);
        d1.setCategory(c11);
        d1.setName("Hyderabadi Chicken Dum Biryani");
        d1.setDescription("Long-grain fragrant basmati rice layered with spiced marinated chicken and saffron.");
        d1.setPrice(BigDecimal.valueOf(290.0));
        d1.setMrp(BigDecimal.valueOf(320.0));
        d1.setImageUrl("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600");
        d1.setVeg(false);
        d1.setBestseller(true);
        d1 = dishRepository.save(d1);

        dishVariantRepository.save(new DishVariant(d1, "Single (1 Piece + Rice)", BigDecimal.valueOf(190.0)));
        dishVariantRepository.save(new DishVariant(d1, "Full (2 Pieces + Extra Rice)", BigDecimal.valueOf(290.0)));
        dishAddonRepository.save(new DishAddon(d1, "Extra Salan Gravy", BigDecimal.valueOf(25.0)));
        dishAddonRepository.save(new DishAddon(d1, "Boiled Egg (2 Pcs)", BigDecimal.valueOf(30.0)));

        Dish d2 = new Dish();
        d2.setRestaurant(r1);
        d2.setCategory(c12);
        d2.setName("Murgh Malai Tikka");
        d2.setDescription("Creamy boneless chicken kebabs marinated in cashew paste and cream, chargrilled.");
        d2.setPrice(BigDecimal.valueOf(310.0));
        d2.setImageUrl("https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600");
        d2.setVeg(false);
        d2.setBestseller(true);
        dishRepository.save(d2);

        // Restaurant 2: Pizza Paradise
        Restaurant r2 = new Restaurant();
        r2.setName("Pizza Paradise");
        r2.setSlug("pizza-paradise-jubilee-hills");
        r2.setBusinessSector(BusinessSector.FOOD);
        r2.setSectorDisplayName("Wood-fired Gourmet Pizzeria");
        r2.setDescription("Artisanal sourdough wood-fired pizzas with imported Italian buffalo mozzarella.");
        r2.setCuisines("Italian, Pizza, Pasta, Fast Food");
        r2.setLogoUrl("https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200");
        r2.setBannerUrl("https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000");
        r2.setArea("Jubilee Hills");
        r2.setCity("Hyderabad");
        r2.setAddress("Road No. 36, Jubilee Hills");
        r2.setPincode("500033");
        r2.setAvgRating(4.6);
        r2.setTotalRatings(520);
        r2.setDeliveryTimeEstimate("30-40 mins");
        r2.setDistanceKm(3.8);
        r2.setCostForTwo(BigDecimal.valueOf(600.0));
        r2.setDeliveryFee(BigDecimal.valueOf(50.0));
        r2.setOpen(true);
        r2.setStatus(RestaurantStatus.ACTIVE);
        r2 = restaurantRepository.save(r2);

        Category c21 = categoryRepository.save(new Category(r2, "Gourmet Wood-Fired Pizzas", 1));
        Dish d21 = new Dish();
        d21.setRestaurant(r2);
        d21.setCategory(c21);
        d21.setName("Classic Margherita Classica");
        d21.setDescription("San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.");
        d21.setPrice(BigDecimal.valueOf(380.0));
        d21.setImageUrl("https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600");
        d21.setVeg(true);
        d21.setBestseller(true);
        d21 = dishRepository.save(d21);
        dishVariantRepository.save(new DishVariant(d21, "Regular 8 inch", BigDecimal.valueOf(280.0)));
        dishVariantRepository.save(new DishVariant(d21, "Medium 11 inch", BigDecimal.valueOf(380.0)));
    }

    private void seedInstamartGrocery() {
        logger.info("Seeding Swiggy Instamart (Quick Commerce Grocery)...");

        Restaurant instamart = new Restaurant();
        instamart.setName("Swiggy Instamart - Madhapur Dark Store");
        instamart.setSlug("swiggy-instamart-madhapur-dark-store");
        instamart.setBusinessSector(BusinessSector.GROCERY);
        instamart.setSectorDisplayName("Instamart Quick Commerce");
        instamart.setQuickCommerce(true);
        instamart.setDescription("Instant grocery, dairy, fresh vegetables, snacks & household essentials delivered in 10-15 minutes.");
        instamart.setCuisines("Dairy & Bread, Snacks, Beverages, Fresh Veggies, Household");
        instamart.setLogoUrl("https://images.unsplash.com/photo-1542838132-92c53300491e?w=200");
        instamart.setBannerUrl("https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=1000");
        instamart.setArea("Madhapur");
        instamart.setCity("Hyderabad");
        instamart.setAddress("Dark Store Hub 4, Hitech City Cyber Towers lane");
        instamart.setPincode("500081");
        instamart.setPhone("040-10101010");
        instamart.setEmail("instamart.madhapur@swiggy.in");
        instamart.setAvgRating(4.8);
        instamart.setTotalRatings(1250);
        instamart.setDeliveryTimeEstimate("10-15 mins");
        instamart.setDistanceKm(1.1);
        instamart.setCostForTwo(BigDecimal.valueOf(200.0));
        instamart.setDeliveryFee(BigDecimal.valueOf(15.0));
        instamart.setPackagingFee(BigDecimal.valueOf(5.0));
        instamart.setTaxPercentage(BigDecimal.valueOf(5.0));
        instamart.setFreeDeliveryThreshold(BigDecimal.valueOf(199.0));
        instamart.setPureVeg(false);
        instamart.setOpen(true);
        instamart.setStatus(RestaurantStatus.ACTIVE);
        instamart.setFssaiNumber("13621014999888");
        instamart.setGstin("36SWIGGY1234F1Z1");
        instamart = restaurantRepository.save(instamart);

        // Category 1: Dairy, Bread & Eggs
        Category catDairy = categoryRepository.save(new Category(instamart, "Dairy, Bread & Eggs", 1));

        Dish g1 = new Dish();
        g1.setRestaurant(instamart);
        g1.setCategory(catDairy);
        g1.setName("Amul Taaza Homogenised Toned Milk");
        g1.setDescription("Pasteurised, fresh and pure homogenized toned milk.");
        g1.setBrand("Amul");
        g1.setUnit("500 ml");
        g1.setMrp(BigDecimal.valueOf(28.0));
        g1.setPrice(BigDecimal.valueOf(27.0));
        g1.setStockQuantity(200);
        g1.setImageUrl("https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600");
        g1.setVeg(true);
        g1.setBestseller(true);
        dishRepository.save(g1);

        Dish g2 = new Dish();
        g2.setRestaurant(instamart);
        g2.setCategory(catDairy);
        g2.setName("English Oven 100% Whole Wheat Brown Bread");
        g2.setDescription("Zero maida, high-fiber freshly baked wholesome brown bread.");
        g2.setBrand("English Oven");
        g2.setUnit("400 g");
        g2.setMrp(BigDecimal.valueOf(55.0));
        g2.setPrice(BigDecimal.valueOf(50.0));
        g2.setStockQuantity(90);
        g2.setImageUrl("https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600");
        g2.setVeg(true);
        g2.setBestseller(true);
        dishRepository.save(g2);

        Dish g3 = new Dish();
        g3.setRestaurant(instamart);
        g3.setCategory(catDairy);
        g3.setName("Eggoz Farm Fresh Nutrient Rich White Eggs");
        g3.setDescription("Farm fresh, sanitized, certified hormone-free premium eggs.");
        g3.setBrand("Eggoz");
        g3.setUnit("Pack of 6");
        g3.setMrp(BigDecimal.valueOf(65.0));
        g3.setPrice(BigDecimal.valueOf(58.0));
        g3.setStockQuantity(140);
        g3.setImageUrl("https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600");
        g3.setVeg(false);
        g3.setBestseller(true);
        dishRepository.save(g3);

        // Category 2: Munchies & Chips
        Category catSnacks = categoryRepository.save(new Category(instamart, "Munchies, Chips & Biscuits", 2));

        Dish g4 = new Dish();
        g4.setRestaurant(instamart);
        g4.setCategory(catSnacks);
        g4.setName("Lay's India's Magic Masala Potato Chips");
        g4.setDescription("Crispy golden potato chips tossed in spicy exotic Indian spices.");
        g4.setBrand("Lay's");
        g4.setUnit("50 g");
        g4.setMrp(BigDecimal.valueOf(20.0));
        g4.setPrice(BigDecimal.valueOf(20.0));
        g4.setStockQuantity(300);
        g4.setImageUrl("https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600");
        g4.setVeg(true);
        g4.setBestseller(true);
        dishRepository.save(g4);

        // Category 3: Cold Drinks & Juices
        Category catBeverages = categoryRepository.save(new Category(instamart, "Cold Drinks & Juices", 3));

        Dish g5 = new Dish();
        g5.setRestaurant(instamart);
        g5.setCategory(catBeverages);
        g5.setName("Coca-Cola Original Taste Chilled Soft Drink");
        g5.setDescription("Refreshing fizzy cola, served best chilled.");
        g5.setBrand("Coca-Cola");
        g5.setUnit("750 ml");
        g5.setMrp(BigDecimal.valueOf(40.0));
        g5.setPrice(BigDecimal.valueOf(38.0));
        g5.setStockQuantity(120);
        g5.setImageUrl("https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600");
        g5.setVeg(true);
        g5.setBestseller(true);
        dishRepository.save(g5);
    }

    private void seedPharmacy() {
        logger.info("Seeding Apollo 24/7 Pharmacy...");

        Restaurant pharmacy = new Restaurant();
        pharmacy.setName("Apollo Pharmacy 24/7 - Hitech City");
        pharmacy.setSlug("apollo-pharmacy-247-hitech-city");
        pharmacy.setBusinessSector(BusinessSector.PHARMACY);
        pharmacy.setSectorDisplayName("Licensed 24/7 Pharmacy");
        pharmacy.setDescription("Authentic medicines, first aid, baby care, daily wellness, and prescription medications.");
        pharmacy.setCuisines("Medicines, First Aid, Vitamins, Daily Wellness, Baby Care");
        pharmacy.setLogoUrl("https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200");
        pharmacy.setBannerUrl("https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1000");
        pharmacy.setArea("Hitech City");
        pharmacy.setCity("Hyderabad");
        pharmacy.setAddress("Shop 101, Cyber Towers Circle, Hitech City");
        pharmacy.setPincode("500081");
        pharmacy.setPhone("040-24724724");
        pharmacy.setEmail("support@apollopharmacy.in");
        pharmacy.setAvgRating(4.7);
        pharmacy.setTotalRatings(890);
        pharmacy.setDeliveryTimeEstimate("20-30 mins");
        pharmacy.setDistanceKm(1.8);
        pharmacy.setCostForTwo(BigDecimal.valueOf(150.0));
        pharmacy.setDeliveryFee(BigDecimal.valueOf(25.0));
        pharmacy.setPackagingFee(BigDecimal.valueOf(5.0));
        pharmacy.setTaxPercentage(BigDecimal.valueOf(5.0));
        pharmacy.setFreeDeliveryThreshold(BigDecimal.valueOf(399.0));
        pharmacy.setPureVeg(true);
        pharmacy.setOpen(true);
        pharmacy.setStatus(RestaurantStatus.ACTIVE);
        pharmacy.setDrugLicenseNumber("DL-TG-HYD-2023-88991");
        pharmacy.setGstin("36APOLLO1234F1Z9");
        pharmacy = restaurantRepository.save(pharmacy);

        Category cPain = categoryRepository.save(new Category(pharmacy, "Fever, Headache & Pain Relief", 1));
        Category cFirstAid = categoryRepository.save(new Category(pharmacy, "First Aid & Antiseptics", 2));
        Category cPrescription = categoryRepository.save(new Category(pharmacy, "Prescription Medicines (Rx)", 3));

        Dish p1 = new Dish();
        p1.setRestaurant(pharmacy);
        p1.setCategory(cPain);
        p1.setName("Dolo 650 Tablet (Paracetamol)");
        p1.setDescription("Effective fever reducer and analgesic for headache, fever and body pain relief.");
        p1.setBrand("Micro Labs");
        p1.setUnit("Strip of 15 Tablets");
        p1.setMrp(BigDecimal.valueOf(34.0));
        p1.setPrice(BigDecimal.valueOf(30.0));
        p1.setStockQuantity(300);
        p1.setPrescriptionRequired(false);
        p1.setImageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600");
        p1.setVeg(true);
        p1.setBestseller(true);
        dishRepository.save(p1);

        Dish p2 = new Dish();
        p2.setRestaurant(pharmacy);
        p2.setCategory(cFirstAid);
        p2.setName("Dettol Antiseptic Liquid Disinfectant");
        p2.setDescription("Trusted antiseptic for first aid, cuts, bites, stings and personal hygiene.");
        p2.setBrand("Dettol");
        p2.setUnit("250 ml");
        p2.setMrp(BigDecimal.valueOf(145.0));
        p2.setPrice(BigDecimal.valueOf(135.0));
        p2.setStockQuantity(120);
        p2.setPrescriptionRequired(false);
        p2.setImageUrl("https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600");
        p2.setVeg(true);
        p2.setBestseller(true);
        dishRepository.save(p2);

        Dish p3 = new Dish();
        p3.setRestaurant(pharmacy);
        p3.setCategory(cPrescription);
        p3.setName("Augmentin 625 Duo Tablet (Amoxicillin & Clavulanate)");
        p3.setDescription("Broad-spectrum antibiotic for bacterial infections. Requires doctor prescription.");
        p3.setBrand("GSK");
        p3.setUnit("Strip of 10 Tablets");
        p3.setMrp(BigDecimal.valueOf(210.0));
        p3.setPrice(BigDecimal.valueOf(195.0));
        p3.setStockQuantity(80);
        p3.setPrescriptionRequired(true); // Mandatory prescription!
        p3.setImageUrl("https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600");
        p3.setVeg(true);
        p3.setBestseller(false);
        dishRepository.save(p3);
    }

    private void seedMeatAndSeafood() {
        logger.info("Seeding Fresh Cut Meat & Seafood...");

        Restaurant meatStore = new Restaurant();
        meatStore.setName("Fresh Cut Meat & Seafood Co.");
        meatStore.setSlug("fresh-cut-meat-seafood-co");
        meatStore.setBusinessSector(BusinessSector.MEAT_FISH);
        meatStore.setSectorDisplayName("Hygienic Cold-Chain Fresh Meat");
        meatStore.setDescription("Antibiotic-residue free tender chicken, rich mutton, and fresh catch seafood delivered chilled.");
        meatStore.setCuisines("Fresh Chicken, Tender Mutton, Freshwater Fish, Prawns");
        meatStore.setLogoUrl("https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200");
        meatStore.setBannerUrl("https://images.unsplash.com/photo-1544025162-d76694265947?w=1000");
        meatStore.setArea("Kondapur");
        meatStore.setCity("Hyderabad");
        meatStore.setAddress("Main Road, Kondapur Near RTA Office");
        meatStore.setPincode("500084");
        meatStore.setAvgRating(4.5);
        meatStore.setTotalRatings(340);
        meatStore.setDeliveryTimeEstimate("30-40 mins");
        meatStore.setDistanceKm(3.2);
        meatStore.setCostForTwo(BigDecimal.valueOf(400.0));
        meatStore.setDeliveryFee(BigDecimal.valueOf(35.0));
        meatStore.setPackagingFee(BigDecimal.valueOf(15.0));
        meatStore.setTaxPercentage(BigDecimal.valueOf(0.0));
        meatStore.setFreeDeliveryThreshold(BigDecimal.valueOf(499.0));
        meatStore.setPureVeg(false);
        meatStore.setOpen(true);
        meatStore.setStatus(RestaurantStatus.ACTIVE);
        meatStore = restaurantRepository.save(meatStore);

        Category cChicken = categoryRepository.save(new Category(meatStore, "Fresh Chicken Cuts", 1));
        Category cMutton = categoryRepository.save(new Category(meatStore, "Tender Mutton", 2));

        Dish m1 = new Dish();
        m1.setRestaurant(meatStore);
        m1.setCategory(cChicken);
        m1.setName("Fresh Tender Chicken Curry Cut (Skinless)");
        m1.setDescription("Mix of bone-in and boneless pieces, thoroughly cleaned and washed.");
        m1.setBrand("FreshCut");
        m1.setUnit("500 g");
        m1.setMrp(BigDecimal.valueOf(180.0));
        m1.setPrice(BigDecimal.valueOf(160.0));
        m1.setStockQuantity(60);
        m1.setImageUrl("https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600");
        m1.setVeg(false);
        m1.setBestseller(true);
        dishRepository.save(m1);

        Dish m2 = new Dish();
        m2.setRestaurant(meatStore);
        m2.setCategory(cMutton);
        m2.setName("Rich Goat Meat Curry & Biryani Cut");
        m2.setDescription("Tender prime cuts of goat meat, ideal for rich slow-cooked curries and biryani.");
        m2.setBrand("FreshCut");
        m2.setUnit("500 g");
        m2.setMrp(BigDecimal.valueOf(480.0));
        m2.setPrice(BigDecimal.valueOf(440.0));
        m2.setStockQuantity(35);
        m2.setImageUrl("https://images.unsplash.com/photo-1544025162-d76694265947?w=600");
        m2.setVeg(false);
        m2.setBestseller(true);
        dishRepository.save(m2);
    }

    private void seedCoupons() {
        Coupon cp1 = new Coupon();
        cp1.setCode("SWIGGY50");
        cp1.setTitle("50% OFF up to ₹100");
        cp1.setDescription("Get 50% discount on orders above ₹199");
        cp1.setDiscountPercentage(BigDecimal.valueOf(50.0));
        cp1.setMaxDiscountAmount(BigDecimal.valueOf(100.0));
        cp1.setMinOrderAmount(BigDecimal.valueOf(199.0));
        cp1.setValidUntil(LocalDate.now().plusMonths(6));

        Coupon cp2 = new Coupon();
        cp2.setCode("INSTA100");
        cp2.setTitle("Instamart Flat ₹100 OFF");
        cp2.setDescription("Flat ₹100 discount on grocery orders above ₹399");
        cp2.setFlatDiscountAmount(BigDecimal.valueOf(100.0));
        cp2.setMinOrderAmount(BigDecimal.valueOf(399.0));
        cp2.setValidUntil(LocalDate.now().plusMonths(6));

        couponRepository.saveAll(List.of(cp1, cp2));
    }

    private void seedSuperAdminData() {
        logger.info("Seeding Super Admin mock platform data (Orders, Stripe Transactions, Settlements, Tickets, Audit Logs)...");

        User customer = userRepository.findByEmail("customer@swiggy.com").orElse(null);
        Restaurant restaurant = restaurantRepository.findAll().stream().findFirst().orElse(null);
        if (customer == null || restaurant == null) return;

        // 1. Seed delivered orders
        Order o1 = new Order();
        o1.setOrderId("SWIGGY_ORD_1001");
        o1.setUser(customer);
        o1.setRestaurant(restaurant);
        o1.setBusinessSector(restaurant.getBusinessSector());
        o1.setStatus(OrderStatus.DELIVERED);
        o1.setPaymentMethod(PaymentMethod.ONLINE);
        o1.setPaymentStatus(PaymentStatus.COMPLETED);
        o1.setItemTotal(BigDecimal.valueOf(400.0));
        o1.setDeliveryFee(BigDecimal.valueOf(30.0));
        o1.setPackagingFee(BigDecimal.valueOf(10.0));
        o1.setTaxAmount(BigDecimal.valueOf(20.0));
        o1.setTotalAmount(BigDecimal.valueOf(460.0));
        o1.setDeliveryAddress("Flat 402, Sunshine Heights, Madhapur");
        o1.setRiderName("Suresh Rider (Swiggy Rider)");
        o1.setRiderPhone("9876543299");
        o1.setCreatedAt(java.time.LocalDateTime.now().minusHours(3));
        o1.setDeliveredAt(java.time.LocalDateTime.now().minusHours(2));
        orderRepository.save(o1);

        Order o2 = new Order();
        o2.setOrderId("SWIGGY_ORD_1002");
        o2.setUser(customer);
        o2.setRestaurant(restaurant);
        o2.setBusinessSector(restaurant.getBusinessSector());
        o2.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        o2.setPaymentMethod(PaymentMethod.ONLINE);
        o2.setPaymentStatus(PaymentStatus.COMPLETED);
        o2.setItemTotal(BigDecimal.valueOf(320.0));
        o2.setDeliveryFee(BigDecimal.valueOf(25.0));
        o2.setPackagingFee(BigDecimal.valueOf(10.0));
        o2.setTaxAmount(BigDecimal.valueOf(16.0));
        o2.setTotalAmount(BigDecimal.valueOf(371.0));
        o2.setDeliveryAddress("Flat 402, Sunshine Heights, Madhapur");
        o2.setRiderName("Suresh Rider (Swiggy Rider)");
        o2.setRiderPhone("9876543299");
        o2.setCreatedAt(java.time.LocalDateTime.now().minusMinutes(25));
        orderRepository.save(o2);

        // 2. Seed PaymentTransactions (Stripe & Razorpay)
        PaymentTransaction tx1 = new PaymentTransaction(
                "pi_live_stripe_9841", o1, customer, BigDecimal.valueOf(460.0),
                "INR", "STRIPE", "SUCCESS", "CARD"
        );
        PaymentTransaction tx2 = new PaymentTransaction(
                "pi_live_stripe_9842", o2, customer, BigDecimal.valueOf(371.0),
                "INR", "STRIPE", "SUCCESS", "CARD"
        );
        PaymentTransaction tx3 = new PaymentTransaction(
                "pi_fail_stripe_9843", o1, customer, BigDecimal.valueOf(550.0),
                "INR", "STRIPE", "FAILED", "CARD"
        );
        tx3.setFailureReason("Insufficient funds / card declined");

        paymentTransactionRepository.saveAll(List.of(tx1, tx2, tx3));

        // 3. Seed Settlements (Pending, Paid, Failed)
        SettlementRecord s1 = new SettlementRecord();
        s1.setRestaurant(restaurant);
        s1.setGrossSales(BigDecimal.valueOf(5000.0));
        s1.setPlatformCommissionPercentage(BigDecimal.valueOf(15.0));
        s1.setPlatformCommissionAmount(BigDecimal.valueOf(750.0));
        s1.setTaxDeducted(BigDecimal.valueOf(50.0));
        s1.setNetPayoutAmount(BigDecimal.valueOf(4200.0));
        s1.setStatus("PENDING");
        s1.setPayoutProvider("STRIPE");

        SettlementRecord s2 = new SettlementRecord();
        s2.setRestaurant(restaurant);
        s2.setGrossSales(BigDecimal.valueOf(12000.0));
        s2.setPlatformCommissionPercentage(BigDecimal.valueOf(15.0));
        s2.setPlatformCommissionAmount(BigDecimal.valueOf(1800.0));
        s2.setTaxDeducted(BigDecimal.valueOf(120.0));
        s2.setNetPayoutAmount(BigDecimal.valueOf(10080.0));
        s2.setStatus("PAID");
        s2.setPayoutProvider("STRIPE");
        s2.setStripeTransferId("tr_stripe_settle_4412");
        s2.setUtrNumber("tr_stripe_settle_4412");
        s2.setPaidAt(java.time.LocalDateTime.now().minusDays(1));

        SettlementRecord s3 = new SettlementRecord();
        s3.setRestaurant(restaurant);
        s3.setGrossSales(BigDecimal.valueOf(3000.0));
        s3.setPlatformCommissionPercentage(BigDecimal.valueOf(15.0));
        s3.setPlatformCommissionAmount(BigDecimal.valueOf(450.0));
        s3.setTaxDeducted(BigDecimal.valueOf(30.0));
        s3.setNetPayoutAmount(BigDecimal.valueOf(2520.0));
        s3.setStatus("FAILED");
        s3.setPayoutProvider("STRIPE");
        s3.setFailureReason("Stripe connected merchant account not yet KYC verified");

        SettlementRecord s4 = new SettlementRecord();
        s4.setRestaurant(restaurant);
        s4.setGrossSales(BigDecimal.valueOf(98000.0));
        s4.setPlatformCommissionPercentage(BigDecimal.valueOf(15.0));
        s4.setPlatformCommissionAmount(BigDecimal.valueOf(14700.0));
        s4.setTaxDeducted(BigDecimal.valueOf(870.0));
        s4.setNetPayoutAmount(BigDecimal.valueOf(82430.0));
        s4.setStatus("PENDING");
        s4.setPayoutProvider("STRIPE");
        s4.setRequiresFourEyes(true);

        settlementRepository.saveAll(List.of(s1, s2, s3, s4));

        // 4. Seed Support Tickets
        SupportTicket t1 = new SupportTicket(
                "TCK-1001", customer, o1,
                "Delayed delivery by 25 minutes",
                "DELIVERY", "HIGH",
                "Rider was stuck near traffic junction and arrived cold."
        );
        t1.setConversationLog("[User]: Rider took 55 mins instead of 30 mins estimate.");

        SupportTicket t2 = new SupportTicket(
                "TCK-1002", customer, o2,
                "Double charge on credit card statement",
                "PAYMENT", "MEDIUM",
                "Customer saw two debits for same order."
        );
        t2.setStatus("RESOLVED");
        t2.setConversationLog("[User]: Duplicate debit.\n[Admin]: Verified extra pending authorization was released by bank.");
        t2.setResolvedAt(java.time.LocalDateTime.now().minusHours(1));

        supportTicketRepository.saveAll(List.of(t1, t2));

        // 5. Seed Audit Logs
        AuditLog al1 = new AuditLog(
                "admin@swiggy.com", "SUPER_ADMIN", "UPDATE_GLOBAL_COMMISSION",
                "CONFIG", "global", "Configured default platform commission rate to 15.0%", "127.0.0.1"
        );
        AuditLog al2 = new AuditLog(
                "admin@swiggy.com", "SUPER_ADMIN", "APPROVE_RESTAURANT",
                "RESTAURANT", String.valueOf(restaurant.getId()), "Approved restaurant " + restaurant.getName(), "127.0.0.1"
        );
        auditLogRepository.saveAll(List.of(al1, al2));

        logger.info("Super Admin mock platform data seeding complete.");
    }

    private void seedEnterpriseStaff() {
        logger.info("Seeding Enterprise Departmental Staff (Finance, Operations, Support)...");

        // 1. Finance Officer
        User fo = new User("Pooja Finance Officer", "finance.officer@swiggy.com", "9111100001",
                passwordEncoder.encode("Password123!"), Role.FINANCE_OFFICER);
        fo.setDepartment(Department.FINANCE);
        fo.setPermissions(Set.of(
                AdminPermission.VIEW_PAYMENTS,
                AdminPermission.REVIEW_PAYMENT_FAILURES,
                AdminPermission.VIEW_SETTLEMENTS,
                AdminPermission.REVIEW_SETTLEMENTS,
                AdminPermission.PROPOSE_COMMISSION_CHANGE,
                AdminPermission.CLAIM_TASK
        ));
        fo.setScopeType(PermissionScope.GLOBAL);
        fo.setScopeValue("ALL");

        // 2. Finance Manager (Checker)
        User fm = new User("Rajesh Finance Manager", "finance.manager@swiggy.com", "9111100002",
                passwordEncoder.encode("Password123!"), Role.FINANCE_MANAGER);
        fm.setDepartment(Department.FINANCE);
        fm.setPermissions(Set.of(
                AdminPermission.VIEW_PAYMENTS,
                AdminPermission.APPROVE_REFUNDS,
                AdminPermission.VIEW_SETTLEMENTS,
                AdminPermission.APPROVE_SETTLEMENTS,
                AdminPermission.EXECUTE_PAYOUTS,
                AdminPermission.APPROVE_COMMISSION_CHANGE,
                AdminPermission.CLAIM_TASK
        ));
        fm.setScopeType(PermissionScope.GLOBAL);
        fm.setScopeValue("ALL");

        // 3. Operations Officer (Scope: Hyderabad)
        User oo = new User("Vikram Ops Officer", "ops.officer@swiggy.com", "9111100003",
                passwordEncoder.encode("Password123!"), Role.OPERATIONS_OFFICER);
        oo.setDepartment(Department.OPERATIONS);
        oo.setPermissions(Set.of(
                AdminPermission.VIEW_RESTAURANTS,
                AdminPermission.APPROVE_KYC,
                AdminPermission.VIEW_ORDERS,
                AdminPermission.MANAGE_ORDERS,
                AdminPermission.VIEW_DELIVERY,
                AdminPermission.DISPATCH_RIDER,
                AdminPermission.CLAIM_TASK
        ));
        oo.setScopeType(PermissionScope.CITY);
        oo.setScopeValue("Hyderabad");

        // 4. Operations Manager
        User om = new User("Ananya Ops Manager", "ops.manager@swiggy.com", "9111100004",
                passwordEncoder.encode("Password123!"), Role.OPERATIONS_MANAGER);
        om.setDepartment(Department.OPERATIONS);
        om.setPermissions(Set.of(
                AdminPermission.VIEW_RESTAURANTS,
                AdminPermission.SUSPEND_RESTAURANTS,
                AdminPermission.APPROVE_KYC,
                AdminPermission.VIEW_ORDERS,
                AdminPermission.MANAGE_ORDERS,
                AdminPermission.VIEW_DELIVERY,
                AdminPermission.DISPATCH_RIDER,
                AdminPermission.CLAIM_TASK
        ));
        om.setScopeType(PermissionScope.GLOBAL);
        om.setScopeValue("ALL");

        // 5. Support Agent (Scope: Hyderabad)
        User sa = new User("Kavita Support Agent", "support.agent@swiggy.com", "9111100005",
                passwordEncoder.encode("Password123!"), Role.SUPPORT_AGENT);
        sa.setDepartment(Department.SUPPORT);
        sa.setPermissions(Set.of(
                AdminPermission.VIEW_CUSTOMERS,
                AdminPermission.VIEW_TICKETS,
                AdminPermission.REPLY_TICKET,
                AdminPermission.RESOLVE_DISPUTE,
                AdminPermission.CLAIM_TASK
        ));
        sa.setScopeType(PermissionScope.CITY);
        sa.setScopeValue("Hyderabad");

        // 6. Support Manager
        User sm = new User("Deepak Support Manager", "support.manager@swiggy.com", "9111100006",
                passwordEncoder.encode("Password123!"), Role.SUPPORT_MANAGER);
        sm.setDepartment(Department.SUPPORT);
        sm.setPermissions(Set.of(
                AdminPermission.VIEW_CUSTOMERS,
                AdminPermission.BLOCK_CUSTOMER,
                AdminPermission.VIEW_TICKETS,
                AdminPermission.REPLY_TICKET,
                AdminPermission.RESOLVE_DISPUTE,
                AdminPermission.CLAIM_TASK
        ));
        sm.setScopeType(PermissionScope.GLOBAL);
        sm.setScopeValue("ALL");

        userRepository.saveAll(List.of(fo, fm, oo, om, sa, sm));
        logger.info("Enterprise Departmental Staff seeded successfully.");
    }

    private void seedOperationalTasks() {
        logger.info("Seeding Operational Exception Queues (Finance, Operations, Support)...");

        SettlementRecord highValSettlement = settlementRepository.findAll().stream()
                .filter(s -> s.getNetPayoutAmount() != null && s.getNetPayoutAmount().compareTo(BigDecimal.valueOf(50000)) >= 0)
                .findFirst().orElse(null);

        String settlementIdStr = highValSettlement != null ? String.valueOf(highValSettlement.getId()) : "1";

        // Task 1: High-Value Settlement Review (Maker-Checker required)
        OperationalTask t1 = new OperationalTask(
                "TSK-1001", Department.FINANCE, "SETTLEMENT_REVIEW", "HIGH",
                "SETTLEMENT", settlementIdStr, BigDecimal.valueOf(82430.0),
                "Hyderabad", "High-value weekly restaurant settlement review for Paradise Biryani (₹82,430). Requires Maker-Checker Four-Eyes signoff before auto-disbursing via Stripe.", 120
        );
        t1.setRequiresFourEyesApproval(true);

        // Task 2: Gateway Payment Drop
        OperationalTask t2 = new OperationalTask(
                "TSK-1002", Department.FINANCE, "PAYMENT_FAILURE", "MEDIUM",
                "PAYMENT", "pi_fail_stripe_9843", BigDecimal.valueOf(550.0),
                "Hyderabad", "Investigate gateway drop for Order #SWIGGY_ORD_1001: Insufficient funds / card declined", 60
        );

        // Task 3: Stuck Order at Dispatch
        OperationalTask t3 = new OperationalTask(
                "TSK-1003", Department.OPERATIONS, "STUCK_ORDER", "URGENT",
                "ORDER", "SWIGGY_ORD_1002", BigDecimal.valueOf(371.0),
                "Hyderabad", "Order delayed at dispatch station. Rider idle for > 20 mins.", 30
        );

        // Task 4: Delayed Delivery Refund Dispute
        OperationalTask t4 = new OperationalTask(
                "TSK-1004", Department.SUPPORT, "CUSTOMER_DISPUTE", "HIGH",
                "DISPUTE", "TCK-1001", BigDecimal.valueOf(460.0),
                "Hyderabad", "Delayed delivery refund request. Rider took 55 mins instead of 30 mins estimate.", 90
        );

        operationalTaskRepository.saveAll(List.of(t1, t2, t3, t4));
        logger.info("Operational Exception Queues seeded successfully (4 tasks).");
    }
}
