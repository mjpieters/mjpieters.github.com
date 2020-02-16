require 'rubygems'
require 'bundler/setup'
Bundler.require(:default, :development, :jekyll_plugins)
require 'jekyll'

HERE = Pathname("./").expand_path
TEST_CACHE = HERE / ".cache" / "htmlproofer"
THEME_GEM = "minimal-mistakes-jekyll"
THEME_REMOTE = "mmistakes/minimal-mistakes"

module JekyllUtils
  @@_site = nil

  def site()
    # retrieve the jekyll site, with config

    @@_site ||= begin
      options = Jekyll::Command.configuration_from_options(
        {:source => HERE.to_s}
      )
      Jekyll::Site.new(options)
    end
    return @@_site
  end

  def run(serve=true)
    options = site().config.merge({
      :watch => serve,
      :serving => serve,
    }).merge( serve ? {:url => 'http://localhost:4000'} : {} )

    unless theme_uptodate
      Jekyll.logger.warn "Warning:",
                         "Remote theme version doesn't match gem version"
      Jekyll.logger.warn "",
                         "Gem: #{Gem.loaded_specs[THEME_GEM].version.to_s}"
      Jekyll.logger.warn "",
                         "Remote theme: #{options['remote_theme'].rpartition('@')[-1]}"
      Jekyll.logger.warn "",
                         "Run `rake theme:update` to update the remote theme version"
    end

    Jekyll::Commands::Build.process(options)
    if serve
      Jekyll::Commands::Serve.process(options)
    end
  rescue
    nil
  end

  def theme_uptodate()
    # check if the remote theme matches the gem version
    config = site().config
    theme_name, _, theme_version = config["remote_theme"].rpartition("@")
    raise "Unexpected remote theme name #{theme_name}" unless theme_name == THEME_REMOTE
    gem_version = Gem.loaded_specs[THEME_GEM].version.to_s
    return theme_version == gem_version
  end
end

namespace :jekyll do
  desc "Build the site out"
  task :build do
    include JekyllUtils
    run(serve=false)
  end

  task :serve do
    include JekyllUtils
    run
  end
end

namespace :theme do
  desc "Update theme version in config"
  task :update do
    require 'psych'
    include JekyllUtils
    if theme_uptodate
      puts "Remote theme up-to-date"
      return
    end

    gem_version = Gem.loaded_specs[THEME_GEM].version.to_s
    site().config.config_files({}).each do |fname|
      data = YAML.load_file(fname)
      if data["remote_theme"]
        data["remote_theme"] = "#{THEME_REMOTE}@#{gem_version}"
        File.open(fname, 'w') do |file|
          file.write(YAML.dump(data))
        end
      end    
    end
    Jekyll.logger.info("Updated remote theme to #{gem_version}")
  end
end
    



desc "Serve up the site (watching for changes)"
task :serve => "jekyll:serve"


desc "Check the site for linking issues"
task :test => "jekyll:build" do
  require 'html-proofer'

  options = {
  	:assume_extension => true,
  	:allow_hash_href => true,
  	:http_status_ignore => [999],  # because LinkedIn doesn't like being pinged
  	:check_html => true,
  	:check_img_http => true,
  	:check_opengraph => true,
    :parallel => {
      :in_processes => 3
    },
    :cache => {
      :storage_dir => TEST_CACHE.to_s,
      :timeframe => "30d",
    },
  }
  destination = JekyllUtils::site().config["destination"]
  HTMLProofer.check_directory(destination, options).run
end
