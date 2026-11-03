package com.example.demo.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Category;
import com.example.demo.repository.CategoryRepository;

@Component
public class CategoryInitializer implements ApplicationRunner {

    private static final String[][] DEFAULT_CATEGORIES = {
            {"Điện tử", "dien-tu"},
            {"Xe cộ", "xe-co"},
            {"Bất động sản", "bat-dong-san"},
            {"Thời trang", "thoi-trang"},
            {"Đồ gia dụng", "do-gia-dung"},
            {"Thú cưng", "thu-cung"},
            {"Khác", "khac"}
    };

    private final CategoryRepository categoryRepository;

    public CategoryInitializer(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (String[] category : DEFAULT_CATEGORIES) {
            if (!categoryRepository.existsByNameIgnoreCase(category[0])) {
                categoryRepository.save(new Category(category[0], category[1]));
            }
        }
    }
}
