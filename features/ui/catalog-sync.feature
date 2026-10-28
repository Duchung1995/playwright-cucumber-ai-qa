@ui @catalog @REQ-UI-03
Feature: Catalog listing stays in sync with the products API
  As a shopper
  I want filtering, sorting and paging to show exactly what the backend holds
  So that I can trust the catalog

  @smoke
  Scenario: Category filter with price sort matches the API in count and order
    Given I am on the catalog page
    When I sort the products by "Price (Low - High)"
    And I filter the products by the "Pliers" category
    Then the listed products should match the API for category "Pliers" sorted by "Price (Low - High)"
    And the listed prices should be in ascending order

  Scenario: Paging through a sorted catalog matches the API page by page
    Given I am on the catalog page
    When I sort the products by "Name (A - Z)"
    Then the listed products should match API page 1 sorted by "Name (A - Z)"
    When I go to catalog page 2
    Then the listed products should match API page 2 sorted by "Name (A - Z)"
