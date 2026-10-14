# frozen_string_literal: true

module V1
  # Rows of a two-column (audio/video) script version.
  class AvRowsApi < Grape::API
    helpers do
      def load_version!(id, action = :show?)
        version = ScriptVersion.find(id)
        authorize version.script, action
        version
      end

      def row_attrs
        declared(params, include_missing: false).slice(*AvRow::FIELDS.map(&:to_sym))
      end
    end

    resource :script_versions do
      route_param :id, type: Integer do
        desc "Rows of an AV script version, in order", { success: V1::Entities::AvRow, is_array: true }
        get :av_rows do
          authenticate!
          version = load_version!(params[:id])
          present version.av_rows.ordered, with: V1::Entities::AvRow
        end

        desc "Add a row (at the end, or right after after_row_id)", { success: V1::Entities::AvRow }
        params do
          optional :after_row_id, type: Integer
          optional :shot, type: String
          optional :video, type: String
          optional :audio, type: String
          optional :super_text, type: String
          optional :duration_seconds, type: Integer
          optional :notes, type: String
        end
        post :av_rows do
          authenticate!
          version = load_version!(params[:id], :update?)
          row = Av::Rows.new(version).insert(after_row_id: params[:after_row_id], **row_attrs)
          present row, with: V1::Entities::AvRow
        end

        desc "Reorder rows: positions follow the given id sequence", { success: V1::Entities::AvRow, is_array: true }
        params do
          requires :row_ids, type: Array[Integer], desc: "Every row id of this version, in the new order"
        end
        put "av_rows/reorder" do
          authenticate!
          version = load_version!(params[:id], :update?)
          rows = Av::Rows.new(version).reorder(params[:row_ids])
          present rows, with: V1::Entities::AvRow
        rescue ArgumentError => e
          error!({ error: e.message }, 422)
        end

        desc "Shot list as CSV"
        get :shot_list do
          authenticate!
          version = load_version!(params[:id])
          content_type "text/csv"
          header "Content-Type", "text/csv; charset=utf-8"
          header "Content-Disposition", "attachment; filename=\"#{version.script.title.parameterize.presence || 'script'}-round#{version.version_number}-shot-list.csv\""
          env["api.format"] = :binary
          body Av::ShotListCsv.new(version).call
        end
      end
    end

    resource :av_rows do
      route_param :id, type: Integer do
        desc "Update a row", { success: V1::Entities::AvRow }
        params do
          optional :shot, type: String
          optional :video, type: String
          optional :audio, type: String
          optional :super_text, type: String
          optional :duration_seconds, type: Integer
          optional :notes, type: String
        end
        put do
          authenticate!
          row = AvRow.find(params[:id])
          authorize row.script_version.script, :update?
          row.update!(row_attrs)
          present row, with: V1::Entities::AvRow
        end

        desc "Delete a row (the rest renumber)"
        delete do
          authenticate!
          row = AvRow.find(params[:id])
          authorize row.script_version.script, :update?
          Av::Rows.new(row.script_version).destroy(row)
          status 204
          body false
        end
      end
    end
  end
end
