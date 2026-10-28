@api @brands @REQ-API-03
Feature: Brand update and delete lifecycle API
  As a catalog administrator
  I want to rename and remove brands
  So that the catalog stays accurate

  Background:
    Given a brand exists

  @smoke
  Scenario: Update a brand, delete it, and confirm it is gone
    When I update the brand name to "QA Renamed Brand" as the "admin" user
    Then the response status should be 200
    And the response body should match the "update result" schema
    When I retrieve the created brand by id
    Then the response status should be 200
    And the response body field "name" should equal "QA Renamed Brand"
    When I delete the brand as the "admin" user
    Then the response status should be 204
    When I retrieve the created brand by id
    Then the response status should be 404
    And the response body field "message" should equal "Requested item not found"
    When I delete the brand as the "admin" user
    Then the response status should be 404
    When I update the brand name to "Ghost" as the "admin" user
    Then the response status should be 404

  Scenario Outline: Deleting a brand is restricted (<case>)
    Given a new customer is registered via the API
    When I delete the brand <actor>
    Then the response status should be <status>
    And the response body field "message" should equal "<message>"
    When I retrieve the created brand by id
    Then the response status should be 200

    Examples:
      | case                | actor                       | status | message      |
      | anonymous caller    | without authentication      | 401    | Unauthorized |
      | customer role       | as the "new customer" user  | 403    | Forbidden    |
