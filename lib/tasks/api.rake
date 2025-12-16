# frozen_string_literal: true

namespace :api do
  desc "Print all Grape API routes"
  task routes: :environment do
    puts "\n🔍 Grape API Routes:\n\n"
    puts "METHOD     PATH"
    puts "-" * 80

    V1::Base.routes.each do |route|
      method = route.request_method.ljust(10)
      path = route.path.gsub("(.:format)", "").gsub(":version", "v1")
      puts "#{method} #{path}"
    end

    puts "\n✅ Total routes: #{V1::Base.routes.count}\n\n"
  end

  desc "Print Grape API routes with descriptions"
  task routes_detailed: :environment do
    puts "\n🔍 Grape API Routes (Detailed):\n\n"

    V1::Base.routes.each do |route|
      method = route.request_method.ljust(10)
      path = route.path.gsub("(.:format)", "").gsub(":version", "v1")
      description = route.description || "No description"

      puts "#{method} #{path}"
      puts "  Description: #{description}"
      puts "  Params: #{route.params.keys.join(', ')}" if route.params.any?
      puts ""
    end

    puts "✅ Total routes: #{V1::Base.routes.count}\n\n"
  end

  desc "Generate OpenAPI spec to file"
  task generate_spec: :environment do
    require "json"

    puts "🔄 Generating OpenAPI spec from Grape routes..."

    # Build OpenAPI spec from routes
    spec = {
      openapi: "3.0.0",
      info: {
        title: "Script Generation API",
        version: "1.0.0",
        description: "API for script generation and management platform"
      },
      servers: [
        { url: "http://localhost:3000", description: "Development server" }
      ],
      paths: {},
      components: {
        schemas: {
          User: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              image: { type: "string", nullable: true },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" }
            }
          },
          Project: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              description: { type: "string", nullable: true },
              status: { type: "string", enum: [ "active", "completed", "draft" ] },
              budget: { type: "number", format: "float", nullable: true },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" }
            }
          }
        }
      }
    }

    # Build paths from Grape routes
    V1::Base.routes.each do |route|
      next if route.path.include?("swagger_doc")

      # Clean up path: remove format extensions and replace :version
      path = route.path
        .gsub("(.:format)", "")
        .gsub("(.json)", "")           # Remove (.json) for clean paths
        .gsub(":version", "v1")

      method = route.request_method.downcase

      spec[:paths][path] ||= {}

      # Build response schema based on path
      response_schema = if path.include?("/users")
        if path.include?(":id") || path.include?("current")
          { "$ref" => "#/components/schemas/User" }
        else
          { type: "array", items: { "$ref" => "#/components/schemas/User" } }
        end
      elsif path.include?("/projects")
        if path.include?(":id")
          { "$ref" => "#/components/schemas/Project" }
        else
          { type: "array", items: { "$ref" => "#/components/schemas/Project" } }
        end
      else
        { type: "object" }
      end

      # Generate clean operationId for better method names
      # e.g., "get /v1/projects" -> "getProjects"
      resource_name = path.split("/").last&.gsub(":id", "ById") || "resource"
      operation_id = "#{method}#{resource_name.camelize}"

      spec[:paths][path][method] = {
        operationId: operation_id,
        summary: route.description || "#{route.request_method} #{path}",
        tags: [ path.split("/")[3]&.capitalize || "API" ],
        responses: {
          "200" => {
            description: "Success",
            content: {
              "application/json" => {
                schema: response_schema
              }
            }
          }
        }
      }

      # Add parameters for routes with :id
      if path.include?(":id")
        spec[:paths][path][method][:parameters] = [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: path.include?("/users") ? "string" : "integer" }
          }
        ]
      end

      # Add request body for POST/PUT methods
      if %w[post put].include?(method)
        schema_ref = if path.include?("/users")
          "#/components/schemas/User"
        elsif path.include?("/projects")
          "#/components/schemas/Project"
        end

        if schema_ref
          spec[:paths][path][method][:requestBody] = {
            required: true,
            content: {
              "application/json" => {
                schema: { "$ref" => schema_ref }
              }
            }
          }
        end
      end
    end

    # Write to file
    File.write("public/api-spec-generated.json", JSON.pretty_generate(spec))

    puts "✅ Generated API spec to public/api-spec-generated.json"
    puts "   📊 Routes found: #{V1::Base.routes.count}"
    puts "   📁 File: public/api-spec-generated.json"
    puts ""
  end
end
