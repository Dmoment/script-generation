require 'rails_helper'

RSpec.describe 'Homepage', type: :feature do
  it 'renders the marketing landing shell with React mount' do
    visit root_path
    expect(page).to have_selector('#react-root')
    expect(page).to have_title(/Script Generation/i)
  end
end
