@api @brands @REQ-API-02
Feature: Brand creation and retrieval API
  As a catalog administrator
  I want to create brands and read them back
  So that products can be associated with them

  @smoke
  Scenario: Create a brand and retrieve it by id
    Given a unique brand payload
    When I create the brand via the API
    Then the response status should be 201
    And the response header "content-type" should contain "application/json"
    And the response body should match the "brand" schema
    And the response body should echo the brand payload
    When I retrieve the created brand by id
    Then the response status should be 200
    And the response body should match the "brand" schema
    And the retrieved brand should equal the created brand
    And the response header "content-type" should contain "application/json"
    And the response header "cache-control" should contain "max-age"
    And the response header "access-control-allow-origin" should contain "*"

  Scenario: Creating a brand with a duplicate slug is rejected
    Given a brand exists
    When I create another brand with the same slug
    Then the response status should be 409
    And the response body field "slug" should contain "already exists"

  Scenario: Creating a brand without required fields fails validation
    When I create a brand with an empty payload
    Then the response status should be 422
    And the response body field "name" should contain "required"
    And the response body field "slug" should contain "required"
