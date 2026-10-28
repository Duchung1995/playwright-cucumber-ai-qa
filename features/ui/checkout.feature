@ui @checkout @REQ-UI-01
Feature: Purchase a product end to end
  As a registered customer
  I want to find a product and check out
  So that I receive an order confirmation

  # The customer is seeded through the API (isolated from the shared demo account, which anyone can edit)
  # and the UI must reflect that backend state in the prefilled billing address.

  @smoke
  Scenario: Signed-in customer buys a searched product with cash on delivery
    Given a new customer is registered via the API
    And I am signed in as the new customer
    When I search the catalog for "Pliers"
    Then the search results should include "Combination Pliers"
    When I open the product "Combination Pliers"
    And I add 2 of the product to the cart
    Then the cart badge should show 2 items
    When I open the cart
    Then the cart should contain 2 x "Combination Pliers" priced at the product's unit price
    When I continue past the sign-in step
    Then the billing address should be prefilled from my profile
    When I continue to payment
    And I pay with "Cash on Delivery"
    Then I should see the payment message "Payment was successful"
    When I place the order
    Then I should see an order confirmation with an invoice number
