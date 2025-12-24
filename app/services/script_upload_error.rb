# frozen_string_literal: true

module ScriptUploadError
  # Base exception for script upload errors
  class Base < StandardError
    attr_reader :status_code

    def initialize(message, status_code = 422)
      super(message)
      @status_code = status_code
    end
  end

  # File validation errors (400 Bad Request)
  class FileValidationError < Base
    def initialize(message)
      super(message, 400)
    end
  end

  # Script validation errors (422 Unprocessable Entity)
  class ValidationError < Base
    attr_reader :errors

    def initialize(message, errors = [])
      super(message, 422)
      @errors = errors.is_a?(Array) ? errors : [errors]
    end
  end

  # File attachment errors (422 Unprocessable Entity)
  class AttachmentError < Base
    def initialize(message)
      super(message, 422)
    end
  end
end



